//! Spawns the `mcp` binary and talks MCP (JSON-RPC over stdio) to it:
//! initialize, tools/list, three tools/call, resources/list and resources/read.

use std::{
    io::{BufRead, BufReader, Write},
    process::{Child, ChildStdin, Command, Stdio},
    sync::mpsc,
    thread,
    time::Duration,
};

use serde_json::{json, Value};

struct Server {
    child: Child,
    stdin: ChildStdin,
    lines: mpsc::Receiver<String>,
}

impl Server {
    fn start() -> Self {
        Self::start_with(&[])
    }

    fn start_with(env: &[(&str, &str)]) -> Self {
        let mut command = Command::new(env!("CARGO_BIN_EXE_mcp"));
        for (key, value) in env {
            command.env(key, value);
        }
        let mut child = command
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .expect("start mcp binary");
        let stdin = child.stdin.take().unwrap();
        let stdout = child.stdout.take().unwrap();
        let (sender, lines) = mpsc::channel();
        thread::spawn(move || {
            for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                if sender.send(line).is_err() {
                    break;
                }
            }
        });
        Self {
            child,
            stdin,
            lines,
        }
    }

    fn send(&mut self, message: Value) {
        writeln!(self.stdin, "{message}").unwrap();
        self.stdin.flush().unwrap();
    }

    fn send_raw(&mut self, line: &str) {
        writeln!(self.stdin, "{line}").unwrap();
        self.stdin.flush().unwrap();
    }

    /// The next message on stdout; panics after 60 s, which is what a
    /// client without an answer would do.
    fn next(&mut self) -> Value {
        let line = self
            .lines
            .recv_timeout(Duration::from_secs(60))
            .expect("the server answers");
        serde_json::from_str(&line).unwrap()
    }

    fn request(&mut self, id: u64, method: &str, params: Value) -> Value {
        self.send(json!({ "jsonrpc": "2.0", "id": id, "method": method, "params": params }));
        loop {
            let line = self
                .lines
                .recv_timeout(Duration::from_secs(60))
                .unwrap_or_else(|_| panic!("no answer to {method}"));
            let message: Value = serde_json::from_str(&line).unwrap();
            if message["id"] == id {
                assert!(message.get("error").is_none(), "{method}: {message}");
                return message["result"].clone();
            }
        }
    }
}

impl Drop for Server {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

fn example_project() -> Value {
    let path = format!(
        "{}/../../training-data/nta8800-example-terraced-dwelling.json",
        env!("CARGO_MANIFEST_DIR")
    );
    fn strip(value: Value) -> Value {
        match value {
            Value::Object(map) => Value::Object(
                map.into_iter()
                    .filter(|(_, item)| !item.is_null())
                    .map(|(key, item)| (key, strip(item)))
                    .collect(),
            ),
            Value::Array(items) => Value::Array(items.into_iter().map(strip).collect()),
            other => other,
        }
    }
    strip(serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap())
}

#[test]
fn gas_auxiliary_mcp_preserves_invalid_month_path_without_partial_results() {
    let mut months = (1..=12)
        .map(|month| {
            json!({
                "month": month,
                "hours": nta8800_core::climate::MONTH_HOURS[(month - 1) as usize],
                "generatorOutputKwh": 1000.0
            })
        })
        .collect::<Vec<_>>();
    months[0]["month"] = json!(0);
    let input = json!({
        "generatorId": "ga-1", "drive": "absorption", "nominalThermalCapacityKw": 20.0,
        "capacityReference": "plate", "standbyElectronicsW": 10.0,
        "burnerAuxiliaryWPerKw": 1.0, "solutionPumpWPerKw": 0.0,
        "coefficientsReference": "draft 9.6.8.2.3", "meanModulation": 1.0,
        "modulationReference": "draft 9.6.8.2.3", "buildingShare": 1.0,
        "buildingShareReference": "whole building", "forfaitCopUsed": true,
        "monthHoursReference": "hour schedule", "generatorOutputReference": "generator ledger",
        "months": months
    });
    let mut server = Server::start();
    server.request(
        1,
        "initialize",
        json!({
            "protocolVersion": "2025-06-18", "capabilities": {},
            "clientInfo": { "name": "gas-auxiliary-audit-test", "version": "1" }
        }),
    );
    server.send(json!({ "jsonrpc": "2.0", "method": "notifications/initialized" }));
    let response = server.request(
        2,
        "tools/call",
        json!({ "name": "diagnose_gas_heat_pump_aux_draft", "arguments": { "input": input } }),
    );
    assert_eq!(response["isError"], true, "{response}");
    let assessment = &response["structuredContent"];
    assert_eq!(assessment["status"], "invalid");
    assert!(assessment["monthly"].as_array().unwrap().is_empty());
    assert!(assessment["annualAuxiliaryElectricityKwh"].is_null());
    assert!(assessment["issues"]
        .as_array()
        .unwrap()
        .iter()
        .any(|issue| {
            issue["code"] == "month_invalid_or_duplicate" && issue["path"] == "months[0].month"
        }));
    assert!(!assessment["issues"]
        .as_array()
        .unwrap()
        .iter()
        .any(|issue| {
            issue["code"] == "month_hours_not_normative" && issue["path"] == "months[0].hours"
        }));
    assert_eq!(
        serde_json::from_str::<Value>(response["content"][0]["text"].as_str().unwrap()).unwrap(),
        *assessment
    );
}

#[test]
fn hybrid_mcp_preserves_nested_auxiliary_audit_path_without_partial_results() {
    let input = json!({
        "dispatch": {
            "nodeInputKwh": (1..=12).map(|month| json!({"month": month, "energyKwh": 1000.0})).collect::<Vec<_>>(),
            "nodeInputReference": "node balance", "designContext": "new_build",
            "generators": [
                {"id": "hp", "class": "heat_pump", "classificationReference": "design schedule",
                 "nominalThermalPowerKw": 4.0, "powerReference": "plate", "priorityEfficiency": 4.8,
                 "efficiencyReference": "table"},
                {"id": "boiler", "class": "other_boiler", "classificationReference": "design schedule",
                 "nominalThermalPowerKw": 6.0, "powerReference": "plate", "priorityEfficiency": 0.95,
                 "efficiencyReference": "table 9.25"}
            ]
        },
        "forfait": {"generatorId": "hp", "classificationSourceReference": "source design",
            "scope": "residential_at_most25_kw", "source": "collective15_to20_c", "sink": "hydronic",
            "designSupplyTemperatureC": 35.0, "thermalCapacityKw": 4.0,
            "capacitySourceReference": "plate", "collectiveBuildingInstallation": false,
            "sourceCorrectionFactor": null, "sourceCorrectionReference": null,
            "sourceTemperatureC": 15.0, "sourceTemperatureEvidenceReference": "source meter"},
        "sourceSystem": "collective_groundwater_surface_or_at_least15_c",
        "sourceSystemReference": "source design",
        "boiler": {"generatorId": "boiler", "role": "individual_supplementary",
            "location": "inside_thermal_boundary", "kind": "hr107", "fuel": "natural_gas",
            "averageDesignEmissionTemperatureC": 45.0, "emissionCircuit": "direct",
            "equipmentReference": "boiler plate", "locationReference": "site inspection",
            "temperatureAndCircuitReference": "heating design", "pilotFlamePresent": false},
        "heatPumpAuxiliaryMeasurements": {"generatorId": "hp", "generatorSourceReference": "hp plate",
            "measurements": {"standbyElectronicsW": 10.0, "deliveryPumpDuringCompressorW": 200.0,
                "deliveryPumpPrePostW": 90.0, "pumpPreRunSeconds": 300.0,
                "pumpPostRunSeconds": 300.0, "averageCompressorOnSeconds": 600.0,
                "meanCompressorModulation": 0.5, "nominalElectricDriveKw": 2.0,
                "measurementSourceReference": "", "timingSourceReference": "cycle measurements"}},
        "declaredOperatingLimitsPresent": false
    });
    let mut server = Server::start();
    server.request(
        1,
        "initialize",
        json!({
            "protocolVersion": "2025-06-18", "capabilities": {},
            "clientInfo": {"name": "hybrid-audit-test", "version": "1"}
        }),
    );
    server.send(json!({ "jsonrpc": "2.0", "method": "notifications/initialized" }));
    let response = server.request(
        2,
        "tools/call",
        json!({
            "name": "diagnose_hybrid_heat_pump_monthly_draft", "arguments": {"input": input}
        }),
    );
    assert_eq!(response["isError"], true, "{response}");
    let assessment = &response["structuredContent"];
    assert_eq!(assessment["status"], "invalid");
    assert!(assessment["dispatch"].is_null());
    assert!(assessment["heatPump"].is_null());
    assert!(assessment["boiler"].is_null());
    assert!(assessment["heatPumpAuxiliary"].is_null());
    assert!(assessment["issues"]
        .as_array()
        .unwrap()
        .iter()
        .any(|issue| {
            issue["code"] == "source_required"
                && issue["path"]
                    == "heatPumpAuxiliaryMeasurements.measurements.measurementSourceReference"
        }));
    assert_eq!(
        serde_json::from_str::<Value>(response["content"][0]["text"].as_str().unwrap()).unwrap(),
        *assessment
    );
}

#[test]
fn gas_chain_reference_mcp_returns_submitted_basis_and_source_without_verification() {
    let path = format!(
        "{}/../../training-data/nta8800-gas-chain-diagnostic-synthetic.json",
        env!("CARGO_MANIFEST_DIR")
    );
    let case: Value = serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap();
    let mut server = Server::start();
    server.request(
        1,
        "initialize",
        json!({
            "protocolVersion": "2025-06-18",
            "capabilities": {},
            "clientInfo": { "name": "gas-chain-test", "version": "1" }
        }),
    );
    server.send(json!({ "jsonrpc": "2.0", "method": "notifications/initialized" }));
    let response = server.request(
        2,
        "tools/call",
        json!({ "name": "compare_gas_heat_pump_chain_diagnostic", "arguments": { "case": case } }),
    );
    assert_eq!(response["isError"], false, "{response}");
    let comparison = &response["structuredContent"];
    assert_eq!(comparison["status"], "compared_pass");
    assert_eq!(comparison["metrics"].as_array().unwrap().len(), 25);
    assert_eq!(
        comparison["source"]["documentId"],
        case["source"]["documentId"]
    );
    assert_eq!(
        comparison["metrics"][0]["calculationBasis"],
        case["expected"][0]["calculationBasis"]
    );
    assert_eq!(comparison["referenceVerified"], false);
    assert_eq!(
        serde_json::from_str::<Value>(response["content"][0]["text"].as_str().unwrap()).unwrap(),
        *comparison
    );
    let mut invalid_case = case.clone();
    invalid_case["input"]["monthly"]["forfait"]["capacityReference"] = json!("");
    let response = server.request(
        3,
        "tools/call",
        json!({ "name": "compare_gas_heat_pump_chain_diagnostic", "arguments": { "case": invalid_case } }),
    );
    assert_eq!(response["isError"], true, "{response}");
    let comparison = &response["structuredContent"];
    assert_eq!(comparison["status"], "invalid_case");
    assert!(comparison["issues"].as_array().unwrap().iter().any(|item| {
        item["code"] == "source_required"
            && item["path"] == "input.monthly.forfait.capacityReference"
    }));
    assert!(comparison["metrics"].as_array().unwrap().is_empty());

    let path = format!(
        "{}/../../training-data/nta8800-gas-chain-diagnostic-collective-synthetic.json",
        env!("CARGO_MANIFEST_DIR")
    );
    let collective: Value = serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap();
    let response = server.request(
        4,
        "tools/call",
        json!({ "name": "compare_gas_heat_pump_chain_diagnostic", "arguments": { "case": collective } }),
    );
    assert_eq!(response["isError"], false, "{response}");
    let comparison = &response["structuredContent"];
    assert_eq!(comparison["status"], "compared_pass");
    assert_eq!(comparison["metrics"].as_array().unwrap().len(), 37);
    assert_eq!(
        comparison["source"]["documentId"],
        collective["source"]["documentId"]
    );
    assert_eq!(
        comparison["metrics"][36]["calculationBasis"],
        collective["expected"][36]["calculationBasis"]
    );
    assert_eq!(comparison["referenceVerified"], false);
    assert_eq!(
        serde_json::from_str::<Value>(response["content"][0]["text"].as_str().unwrap()).unwrap(),
        *comparison
    );
}

#[test]
fn gas_chain_mcp_exposes_nested_cop_evidence_path_without_partial_results() {
    let path = format!(
        "{}/../../training-data/nta8800-gas-chain-diagnostic-synthetic.json",
        env!("CARGO_MANIFEST_DIR")
    );
    let case: Value = serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap();
    let mut input = case["input"].clone();
    input["monthly"]["forfait"]["capacityReference"] = json!("");
    let mut server = Server::start();
    server.request(
        1,
        "initialize",
        json!({
            "protocolVersion": "2025-06-18",
            "capabilities": {},
            "clientInfo": { "name": "gas-chain-audit-test", "version": "1" }
        }),
    );
    server.send(json!({ "jsonrpc": "2.0", "method": "notifications/initialized" }));
    let response = server.request(
        2,
        "tools/call",
        json!({ "name": "diagnose_gas_heat_pump_chain_draft", "arguments": { "input": input } }),
    );
    assert_eq!(response["isError"], true, "{response}");
    let assessment = &response["structuredContent"];
    assert_eq!(assessment["status"], "invalid");
    assert!(assessment["issues"].as_array().unwrap().iter().any(|item| {
        item["code"] == "source_required" && item["path"] == "monthly.forfait.capacityReference"
    }));
    assert!(assessment["monthly"].as_array().unwrap().is_empty());
    assert!(assessment["annualEquipmentAuxiliaryElectricityKwh"].is_null());
    assert_eq!(
        serde_json::from_str::<Value>(response["content"][0]["text"].as_str().unwrap()).unwrap(),
        *assessment
    );
}

#[test]
fn collective_gas_source_mcp_requires_a_declared_evidence_kind() {
    let path = format!(
        "{}/../../training-data/nta8800-gas-chain-diagnostic-collective-synthetic.json",
        env!("CARGO_MANIFEST_DIR")
    );
    let case: Value = serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap();
    let mut input = json!({
        "chain": case["input"],
        "collectiveSourceEvidenceKind": "design_documents",
        "sourceTemperatureClass": "below20_c",
        "sourceTemperatureReference": "synthetic source plan",
        "noQualityDeclarationConfirmed": true,
        "noQualityDeclarationReference": "synthetic register check"
    });
    let mut server = Server::start();
    server.request(
        1,
        "initialize",
        json!({
            "protocolVersion": "2025-06-18",
            "capabilities": {},
            "clientInfo": { "name": "collective-source-test", "version": "1" }
        }),
    );
    server.send(json!({ "jsonrpc": "2.0", "method": "notifications/initialized" }));
    let response = server.request(
        2,
        "tools/call",
        json!({ "name": "diagnose_gas_collective_source_draft", "arguments": { "input": input } }),
    );
    assert_eq!(response["isError"], false, "{response}");
    assert_eq!(response["structuredContent"]["status"], "diagnostic_valid");
    assert_eq!(response["structuredContent"]["sourceEnergyCarrier"], "dh");
    assert_eq!(
        response["structuredContent"]["collectiveSourceEvidenceKind"],
        "design_documents"
    );
    assert_eq!(
        response["structuredContent"]["sourceSystemReference"],
        "synthetic collective source plan"
    );
    assert_eq!(
        response["structuredContent"]["sourceTemperatureClass"],
        "below20_c"
    );
    assert_eq!(
        response["structuredContent"]["sourceTemperatureReference"],
        "synthetic source plan"
    );
    assert_eq!(
        response["structuredContent"]["noQualityDeclarationConfirmed"],
        true
    );
    assert_eq!(
        response["structuredContent"]["noQualityDeclarationReference"],
        "synthetic register check"
    );
    assert_eq!(response["structuredContent"]["referenceVerified"], false);
    input["collectiveSourceEvidenceKind"] = Value::Null;
    let response = server.request(
        3,
        "tools/call",
        json!({ "name": "diagnose_gas_collective_source_draft", "arguments": { "input": input } }),
    );
    assert_eq!(response["isError"], true, "{response}");
    assert_eq!(response["structuredContent"]["status"], "invalid");
    assert!(response["structuredContent"]["monthly"]
        .as_array()
        .unwrap()
        .is_empty());
    input["collectiveSourceEvidenceKind"] = json!("design_documents");
    input["chain"]["auxiliary"]["generatorId"] = json!("other-generator");
    let response = server.request(
        4,
        "tools/call",
        json!({ "name": "diagnose_gas_collective_source_draft", "arguments": { "input": input } }),
    );
    assert_eq!(response["isError"], true, "{response}");
    assert!(response["structuredContent"]["issues"]
        .as_array()
        .unwrap()
        .iter()
        .any(|issue| {
            issue["code"] == "generator_mismatch" && issue["path"] == "chain.auxiliary.generatorId"
        }));
    assert!(!response["structuredContent"]["issues"]
        .as_array()
        .unwrap()
        .iter()
        .any(|issue| issue["code"] == "chain_invalid"));
}

#[test]
fn mcp_server_speaks_the_protocol() {
    let mut server = Server::start();
    let init = server.request(
        1,
        "initialize",
        json!({
            "protocolVersion": "2025-06-18",
            "capabilities": {},
            "clientInfo": { "name": "test", "version": "1" }
        }),
    );
    assert_eq!(init["protocolVersion"], "2025-06-18");
    assert_eq!(init["serverInfo"]["name"], "open-energy-studio-nta8800");
    assert!(init["capabilities"]["tools"].is_object());
    assert!(init["capabilities"]["resources"].is_object());
    server.send(json!({ "jsonrpc": "2.0", "method": "notifications/initialized" }));

    let tools = server.request(2, "tools/list", json!({}));
    let names: Vec<&str> = tools["tools"]
        .as_array()
        .unwrap()
        .iter()
        .map(|tool| tool["name"].as_str().unwrap())
        .collect();
    assert_eq!(names.len(), nta8800_service::operations::operations().len());
    for name in [
        "calculate_project_performance",
        "assess_residential_survey",
        "assess_relabel",
        "get_version",
    ] {
        assert!(names.contains(&name), "{name}");
    }
    let schema = &tools["tools"]
        .as_array()
        .unwrap()
        .iter()
        .find(|tool| tool["name"] == "calculate_project_performance")
        .unwrap()["inputSchema"];
    assert_eq!(schema["required"], json!(["project"]));

    let version = server.request(
        3,
        "tools/call",
        json!({ "name": "get_version", "arguments": {} }),
    );
    assert_eq!(version["isError"], false);
    assert_eq!(
        version["structuredContent"]["kernelVersion"],
        nta8800_core::KERNEL_VERSION
    );

    let performance = server.request(
        4,
        "tools/call",
        json!({ "name": "calculate_project_performance", "arguments": { "project": example_project() } }),
    );
    assert_eq!(performance["isError"], false, "{performance}");
    assert_eq!(
        performance["structuredContent"]["status"],
        "calculated_unverified"
    );
    let text = performance["content"][0]["text"].as_str().unwrap();
    assert_eq!(
        serde_json::from_str::<Value>(text).unwrap(),
        performance["structuredContent"]
    );

    let refused = server.request(
        5,
        "tools/call",
        json!({ "name": "calculate_project_performance", "arguments": {} }),
    );
    assert_eq!(refused["isError"], true);
    assert_eq!(
        refused["structuredContent"]["code"],
        "missing_request_member"
    );
    assert_eq!(refused["structuredContent"]["path"], "project");

    let resources = server.request(6, "resources/list", json!({}));
    let uris: Vec<&str> = resources["resources"]
        .as_array()
        .unwrap()
        .iter()
        .map(|resource| resource["uri"].as_str().unwrap())
        .collect();
    assert!(uris.contains(&"oes://examples/terraced-dwelling"));
    assert!(uris.contains(&"oes://api/openapi.json"));
    assert!(uris.contains(&"oes://manual/index"));

    let read = server.request(
        7,
        "resources/read",
        json!({ "uri": "oes://kernel/interpretations" }),
    );
    let text = read["contents"][0]["text"].as_str().unwrap();
    let groups: Value = serde_json::from_str(text).unwrap();
    assert!(!groups.as_array().unwrap().is_empty());
}

/// Lines the MCP library would leave unanswered get a JSON-RPC error, and
/// the server keeps answering afterwards: invalid and truncated JSON,
/// nesting deeper than 128 levels, non-object arguments and a line longer
/// than the cap (set to 4096 bytes here; 64 MiB by default).
#[test]
fn mcp_server_answers_malformed_lines() {
    let mut server = Server::start_with(&[("OES_MCP_MAX_LINE_BYTES", "4096")]);
    server.request(
        1,
        "initialize",
        json!({
            "protocolVersion": "2025-06-18",
            "capabilities": {},
            "clientInfo": { "name": "test", "version": "1" }
        }),
    );
    server.send(json!({ "jsonrpc": "2.0", "method": "notifications/initialized" }));

    server.send_raw("{bad json");
    let bad = server.next();
    assert_eq!(bad["error"]["code"], -32700, "{bad}");
    assert_eq!(bad["id"], Value::Null);

    server.send_raw(r#"{"jsonrpc":"2.0","id":11,"method":"tools/list""#);
    let truncated = server.next();
    assert_eq!(truncated["error"]["code"], -32700, "{truncated}");
    assert_eq!(truncated["id"], 11);

    let deep = format!(
        r#"{{"jsonrpc":"2.0","id":10,"method":"tools/call","params":{{"name":"get_version","arguments":{{"a":{}{}}}}}}}"#,
        "[".repeat(200),
        "]".repeat(200)
    );
    server.send_raw(&deep);
    let deep = server.next();
    assert_eq!(deep["error"]["code"], -32600, "{deep}");
    assert_eq!(deep["id"], 10);

    server.send(json!({ "jsonrpc": "2.0", "id": 12, "method": "tools/call",
        "params": { "name": "get_version", "arguments": [1] } }));
    let params = server.next();
    assert_eq!(params["error"]["code"], -32602, "{params}");
    assert_eq!(params["id"], 12);

    server.send_raw(&"x".repeat(5000));
    let long = server.next();
    assert_eq!(long["error"]["code"], -32600, "{long}");

    // Still answering.
    let version = server.request(
        13,
        "tools/call",
        json!({ "name": "get_version", "arguments": {} }),
    );
    assert_eq!(version["isError"], false);
}
