/* eslint-disable react/jsx-no-undef */
/* eslint-disable react/prop-types */

import { useEffect, useState } from "react";
import DataPreview from "./DataPreview";

const FlowStep = ({
  flowList,
  previewList,
  setFlowList,
  setPreviewList,
  step,
}) => {
  const [prompt, setPrompt] = useState(flowList[step]);
  const [preview, setPreview] = useState(previewList[step]);

  const handleQuery = async (prompt) => {
    const response = await fetch("http://127.0.0.1:5000/api/manipulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        step,
      }),
    });
    const body = await response.json();

    setPreview(body.preview);
    setFlowList((flowList) => {
      flowList[step] = prompt;
      return flowList;
    });
    setPreviewList((previewList) => {
      previewList[step] = body.preview;
      return previewList;
    });
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  useEffect(() => console.log("YUH", preview), [preview]);

  return (
    <div>
      <input
        type="text"
        value={prompt}
        style={{ width: "500px" }}
        onChange={handlePromptChange}
      />
      {/* {step == flowList.length - 1 && ( */}
      <button onClick={() => handleQuery(prompt)}>Test Step {step}</button>
      {/* )} */}
      <div style={{ marginTop: "5px" }}>
        {prompt && <DataPreview jsonString={preview} />}
      </div>
    </div>
  );
};

export default FlowStep;
