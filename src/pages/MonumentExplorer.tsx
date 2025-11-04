import { useState } from "react";
import { identifyMonument } from "@/lib/api";

type TimelineEvent = { year: number; event: string };

type PredictResponse = {
  monument: string;
  description: string;
  old_image?: string | null;
  new_image?: string | null;
  timeline?: TimelineEvent[];
};

const MonumentExplorer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    setError(null);
    if (f) setPreviewUrl(URL.createObjectURL(f));
  };

  const onSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await identifyMonument(file);
      setResult(data as PredictResponse);
    } catch (err: any) {
      setError(err?.message || "Failed to identify monument");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Monument Timeline Explorer</h1>
      <p className="text-muted-foreground mb-6">
        Upload a photo of a monument to see its info, historical and modern views, and a timeline of key events.
      </p>

      <div className="flex flex-col gap-4 border rounded-lg p-4">
        <input type="file" accept="image/*" onChange={onFileChange} />
        {previewUrl && (
          <img src={previewUrl} alt="preview" className="w-full max-h-96 object-contain rounded" />
        )}
        <button
          onClick={onSubmit}
          disabled={!file || loading}
          className="self-start bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Identify Monument"}
        </button>
        {error && <div className="text-red-600">{error}</div>}
      </div>

      {result && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">{result.monument}</h2>
            <p className="mt-2 text-muted-foreground">{result.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Historic View</h3>
              {result.old_image ? (
                <img src={result.old_image} alt="historic" className="w-full rounded" />
              ) : (
                <div className="text-sm text-muted-foreground">No historic image available.</div>
              )}
            </div>
            <div>
              <h3 className="font-medium mb-2">Modern View</h3>
              {result.new_image ? (
                <img src={result.new_image} alt="modern" className="w-full rounded" />
              ) : (
                <div className="text-sm text-muted-foreground">No modern image available.</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Timeline</h3>
            {result.timeline && result.timeline.length > 0 ? (
              <ul className="space-y-2">
                {result.timeline
                  .slice()
                  .sort((a, b) => a.year - b.year)
                  .map((t, idx) => (
                    <li key={idx} className="border rounded p-3">
                      <span className="font-semibold mr-2">{t.year}</span>
                      <span>{t.event}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">No timeline data available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonumentExplorer;





