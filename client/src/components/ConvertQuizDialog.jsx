export default function ConvertQuizDialog({ show, setShow, convertFile, setConvertFile, convertQuiz, loadingConvert }) {
  if (!show) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) return alert("File must be <= 10MB");
    setConvertFile(file);
  };

  const handleConvert = async () => {
    await convertQuiz();
    setConvertFile(null);
    setShow(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-96 space-y-4">
        <h3 className="font-semibold text-lg">Convert Quiz File</h3>
        <label className="block bg-yellow-100 hover:bg-yellow-200 px-3 py-2 rounded-lg cursor-pointer w-max">
          {convertFile ? convertFile.name : "Choose File"}
          <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileChange} />
        </label>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setShow(false)}
            className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={!convertFile || loadingConvert}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            {loadingConvert ? "Converting..." : "Convert"}
          </button>
        </div>
      </div>
    </div>
  );
}
