"""Test stub for mlx_whisper.writers: writes every format as plain lines (JSON as JSON)."""
import json
import os


def get_writer(output_format, output_dir):
    def write_all(result, output_name, **_):
        base = os.path.join(output_dir, output_name)
        with open(base + ".json", "w") as f:
            json.dump(result, f)
        for ext in ("srt", "vtt", "txt", "tsv"):
            with open(f"{base}.{ext}", "w") as f:
                f.write("\n".join(s["text"].strip() for s in result["segments"]))
    return write_all
