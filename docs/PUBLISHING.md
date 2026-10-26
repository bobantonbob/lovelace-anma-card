# Publish on GitHub and HACS

## 1. Repository

Recommended repository name: **lovelace-anma-card**. Recommended description: “Responsive Home Assistant energy dashboards: Power Flow, Cloud Flow and full system analytics.” Suggested topics: `home-assistant`, `hacs`, `lovelace`, `energy`, `solar`, `dashboard`.

Create an empty public GitHub repository. Extract the supplied ZIP and upload its **contents**, not the ZIP itself and not an extra parent directory. The repository root must contain `anma-card.js`, `hacs.json` and `README.md`. Include `docs`, `examples`, `src` and `tools`. Enable Issues. Include the MIT `LICENSE` file when distributing the code. Set the repository website to https://app.anma-electric.com.ua/.

This is a distribution of the existing ANMA Energy Platform dashboard code. The platform remains the source of truth; do not move the Django backend or catalog into this repository.

GitHub Pages, Docker deployment and a Python server are not required to install the Home Assistant card. GitHub hosts the repository and releases; Home Assistant serves the JavaScript.

## 2. Stable releases

After committing the files to `main`, create a GitHub Release with tag `v0.7.0`, title “ANMA Energy Dashboards 0.7.0”, and publish it as the latest regular release. Copy the relevant CHANGELOG entry into the release notes. Attach the **root `anma-card.js`** and **`anma_dashboard_manual_install.zip`** as release assets. Home Assistant loads the JS module; the ZIP is a manual-install convenience.

The distribution contains the tested platform bundle. `src/anma-card.js` is its maintained entry with embedded shared modules; `src/model.js`, `src/power-flow.js`, `src/cloud-flow.js` and `src/energy-station.js` are shared source snapshots. Cloud Flow's WebP assets are in `src/assets` and are embedded by `tools/build.py`. Run `python tools/build.py`, then `node --check anma-card.js` and `python tools/validate.py`. Commit source and artifact together. Bring changes from the primary platform rather than allowing the distribution to diverge.

## 3. Test as a HACS custom repository

Add `https://github.com/bobantonbob/lovelace-anma-card` in HACS → Custom repositories, type Dashboard. Download, verify the resource and import an example after replacing its entity IDs. Check desktop and mobile, all three views, live values, direction, and persistence after reload. Test on a clean Home Assistant installation before declaring broad compatibility.

Repository: https://github.com/bobantonbob/lovelace-anma-card.

## 4. Default HACS catalog (separate review)

Once the public repository and releases work, run the included `.github/workflows/validate.yaml` action and ensure it passes for category `plugin`. Follow the current action README for its supported version and inputs. A Django/frontend-only card does not require integration `hassfest` checks. As owner or major contributor, follow the official submission instructions and submit the repository to the plugin list in `hacs/default`. Acceptance is up to the HACS maintainers; this package is not already listed or approved.

Official references, checked when packaging:

- [Dashboard/plugin repository structure](https://www.hacs.dev/docs/publish/plugin/)
- [hacs.json and general requirements](https://hacs.dev/docs/publish/start/)
- [Custom repositories](https://hacs.dev/docs/faq/custom_repositories/)
- [Default catalog submission](https://hacs.dev/docs/publish/include/)
- [Official HACS validation action](https://github.com/hacs/action)

## 5. Updates and rollback

Keep the filename `anma-card.js`. For each release, update release notes, rebuild, validate and publish a new tag/release with the new JS asset. Back up dashboard YAML before upgrades. Manual users replace the same file and update the cache version; HACS users use its download/update flow. To roll back, restore the previous resource and dashboard backup. Do not register two versions of the custom element simultaneously.





