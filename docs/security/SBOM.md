# SBOM Guidance

The Expo app package includes an `sbom` npm script intended to generate a
CycloneDX SBOM at:

`compliance/sbom/tatru-medgemma.cdx.json`

## Command

Run from `TatruMedGemmaApp/`:

```sh
npm run sbom
```

## Notes

- The script uses `@cyclonedx/cyclonedx-npm@5.0.0` via `npx`.
- Successful generation may require network access and a working Node/npm
  environment.
- If SBOM generation is blocked in a restricted environment, document the
  command and generate the artifact later in a network-enabled environment.
