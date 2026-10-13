# IntentNav Project Page

Static project page for:

**IntentNav: Learning Spatial-Visual Object Navigation from Human Demonstrations**

## Upload Notes

The page is ready to upload to GitHub Pages as a static site. Demo videos are intentionally ignored for now because the local media folder is large.

Upload these files and folders:

- `index.html`
- `static/`
- `video/README.md`
- `video/**/.gitkeep`
- `.gitignore`
- `README.md`

Do not upload local video files yet:

- `video/**/*.mp4`
- `video/**/*.mov`
- `video/**/*.m4v`
- `video/**/*.avi`
- `video/**/*.webm`

When videos are ready, place them back under the paths referenced in `index.html`, or update the `<source>` paths to match the final uploaded media location.

## Local Preview

From this folder:

```bash
python3 -m http.server 55090
```

Then open:

```text
http://localhost:55090/
```
