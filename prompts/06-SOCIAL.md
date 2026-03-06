# Step 6: Generate Social Preview Image

Generate a 1200x630 PNG image for use as the GitHub social preview (OpenGraph).

## Steps

1. From the project analysis, extract:
   - Project name
   - One-line tagline/description
   - Primary brand color (from CSS/config, or use default #3B82F6)
   - Key tech stack items (2-4 technologies)

2. Execute:
   ```
   node .git-launcher/scripts/image-generator.js \
     --title "{project name}" \
     --subtitle "{tagline}" \
     --color "{brandColor}" \
     --tech "{tech1}, {tech2}, {tech3}" \
     --output git-launch/images/social-preview.png
   ```

3. Check output:
   - If success: "Social preview image generated (1200x630)"
   - If failure: Generate a fallback SVG file instead and note in checklist

## Output
File: `git-launch/images/social-preview.png` (or `.svg` as fallback)
This image should be uploaded to GitHub repo Settings → Social Preview after launch.
