import React, { useState } from "react";
import { identifyMonument } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function MonumentSearch() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await identifyMonument(file);
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Monument Image Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Button onClick={handleUpload} disabled={loading}>
            {loading ? "Analyzing..." : "Search"}
          </Button>

          {result && (
            <div className="mt-4 text-center">
              <h2 className="text-lg font-bold">{result.monument}</h2>
              <p className="text-sm text-gray-600">{result.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
