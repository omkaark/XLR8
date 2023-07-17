/* eslint-disable react/prop-types */

const DataPreview = ({ jsonString }) => {
  if (!jsonString) return <></>;

  console.log(jsonString);

  const json = JSON.parse(jsonString);
  const columns = Object.keys(json);
  const maxRows = Object.values(json).reduce(
    (max, columnData) => Math.max(max, Object.keys(columnData).length),
    0
  );

  return (
    <table
      style={{
        borderCollapse: "collapse",
        width: "min-content",
        minWidth: "500px",
        marginBottom: "40px",
      }}
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

export default DataPreview;
