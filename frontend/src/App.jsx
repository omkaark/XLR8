import { useState } from "react";
import "./App.css";

const renderTable = (json, key) => {
  if (!json) return <></>;
  json = JSON.parse(json);
  const columns = Object.keys(json);

  // Find the maximum number of rows
  const maxRows = Object.values(json).reduce(
    (max, columnData) => Math.max(max, Object.keys(columnData).length),
    0
  );

  return (
    <table
      key={key}
      style={{ borderCollapse: "collapse", width: "min-content" }}
    >
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column}
              style={{ border: "1px solid black", padding: "8px" }}
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: maxRows }, (_, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column) => (
              <td
                key={column}
                style={{ border: "1px solid black", padding: "8px" }}
              >
                {json[column][rowIndex] || ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const App = () => {
  const [flows, setFlows] = useState([]);
  const [initialHead, setInitialHead] = useState("");
  const [responses, setResponses] = useState([]);

  const handleUpload = async (e) => {
    try {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = event.target.result;

        const contentObject = {
          content: fileContent,
        };

        const response = await fetch("http://127.0.0.1:5000/api/file_upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contentObject),
        });

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        const data = await response.json();
        setInitialHead(data.head);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error:", error);
      // Handle error as needed
    }
  };

  const addFlow = () => {
    setFlows([...flows, ""]);
  };

  const handleInputChange = (e, index) => {
    const updatedFlows = [...flows];
    updatedFlows[index] = e.target.value;
    setFlows(updatedFlows);
  };

  const handleTest = async (prompt) => {
    // Make your API call here and store the response
    const response = await fetch(`http://127.0.0.1:5000/api/manipulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });
    const data = await response.json();
    const head = data.head;
    if (responses.length === flows.length) {
      setResponses((r) => {
        r[r.length - 1] = head;
        return r;
      });
      setFlows([...flows]);
    } else {
      setResponses((r) => [...r, head]);
    }
    console.log(responses);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "50px" }}>
      <input type="file" onChange={handleUpload} />
      {renderTable(initialHead)}

      {flows.map((flow, index) => (
        <div key={index}>
          <input
            type="text"
            value={flow}
            style={{ width: "500px" }}
            onChange={(e) => handleInputChange(e, index)}
          />
          <button onClick={() => handleTest(flows[flows.length - 1])}>
            Test Step {index + 1}
          </button>
          <div style={{ marginTop: "5px" }}>
            {renderTable(responses[index], index)}
          </div>
        </div>
      ))}

      {initialHead && (
        <button onClick={addFlow} style={{ maxWidth: "100px" }}>
          Add Flow
        </button>
      )}
    </div>
  );
};

export default App;
