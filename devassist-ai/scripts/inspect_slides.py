import json

with open("slides_dump.json", "r", encoding="utf-8") as f:
    data = json.load(f)

with open("slides_review.txt", "w", encoding="utf-8") as out:
    for s in data:
        s_num = s["slide_num"]
        out.write(f"==============================\nSLIDE {s_num}\n==============================\n")
        for sh in s["shapes"]:
            s_idx = sh["index"]
            name = sh["name"]
            x, y = sh["left"], sh["top"]
            w, h = sh["w"], sh["h"]
            out.write(f"Shape {s_idx} ({name}) [x={x}, y={y}, w={w}, h={h}]:\n")
            out.write(sh["text"] + "\n\n")

print("Successfully written to slides_review.txt")
