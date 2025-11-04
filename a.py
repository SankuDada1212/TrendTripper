import os

IMPORTANT_FILES = {
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "webpack.config.js",
    "tsconfig.json",
    "README.md",
}
IMPORTANT_DIRS = {
    "src",
    "public",
    "backend",
    "api",
    "components",
    "pages",
    "server",
}

IGNORE_DIRS = {
    "node_modules",
    "dist",
    "build",
    ".git",
    ".vscode",
    "__pycache__",
}

def analyze_project(base_dir):
    important = []
    unimportant = []

    for root, dirs, files in os.walk(base_dir):
        # Filter ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for d in dirs:
            full_path = os.path.join(root, d)
            dirname = os.path.basename(full_path)
            if dirname in IMPORTANT_DIRS:
                important.append(f"[DIR]  {full_path}")

        for f in files:
            full_path = os.path.join(root, f)
            filename = os.path.basename(full_path)
            if filename in IMPORTANT_FILES:
                important.append(f"[FILE] {full_path}")
            elif not any(skip in full_path for skip in IGNORE_DIRS):
                unimportant.append(full_path)

    return important, unimportant


if __name__ == "__main__":
    base_directory = r"C:\Users\sanke\Documents\Project\trend-tripper-explorer-main"

    print(f"\n🔍 Scanning: {base_directory}\n")
    important, unimportant = analyze_project(base_directory)

    print("✅ IMPORTANT FILES & DIRECTORIES:\n")
    for item in important:
        print("  ", item)

    print("\n📂 TOTAL IMPORTANT ITEMS:", len(important))

    print("\n⚙️  OTHER FILES (not critical):", len(unimportant))
