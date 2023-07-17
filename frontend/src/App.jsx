import { useEffect, useState } from "react";
import "./App.css";
import DataPreview from "./components/DataPreview";
import FlowStep from "./components/FlowStep";

const App = () => {
  const [flowList, setFlowList] = useState([]);
  const [initialPreview, setInitialPreview] = useState("");
  const [previewList, setPreviewList] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") == "henry") {
      console.log("Demo for henry");
      const flows = [
        "Split name by ,",
        `Add a column called "Entry_IDs" which contains "True" and "False" values. It will be True if ID the first three numbers of ID is less than 500`,
        "Delete name column",
        "Rearrange First name to be first and last name to be second amongst all columns",
        `Place column is in the "City, Street" format convert it to a "Street, City" format`,
      ];
      setFlowList(flows);
      setPreviewList(flows.map(() => ""));
    }
  }, []);

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
        setInitialPreview(data.preview);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const addFlow = () => {
    if (
      (flowList.slice(-1) == "" || previewList.slice(-1) == "") &&
      flowList.length != 0
    )
      return; // Last flow and preview are not set
    setFlowList([...flowList, ""]);
    setPreviewList([...previewList, ""]);
  };

  const downloadFinalCsv = async () => {
    const response = await fetch("http://127.0.0.1:5000/api/file_download", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    const fileContents = data.contents;

    // Create a Blob object from the CSV string
    const blob = new Blob([fileContents], { type: "text/csv" });

    // Create a temporary anchor element
    const anchor = document.createElement("a");

    // Set the anchor's href attribute to the URL of the Blob
    anchor.href = URL.createObjectURL(blob);

    // Set the anchor's download attribute to specify the file name
    anchor.download = "data.csv";

    // Programmatically click the anchor element to trigger the download
    anchor.click();

    // Clean up by revoking the Object URL
    URL.revokeObjectURL(anchor.href);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <input type="file" onChange={handleUpload} />

      <DataPreview jsonString={initialPreview} />

      {flowList.map((_, idx) => (
        <FlowStep
          key={idx}
          flowList={flowList}
          previewList={previewList}
          setFlowList={setFlowList}
          setPreviewList={setPreviewList}
          step={idx}
        />
      ))}

      {initialPreview && (
        <button onClick={addFlow} style={{ maxWidth: "100px" }}>
          Add Flow
        </button>
      )}

      {initialPreview && (
        <button onClick={downloadFinalCsv} style={{ maxWidth: "100px" }}>
          Download Final CSV
        </button>
      )}
    </div>
  );
};

export default App;
