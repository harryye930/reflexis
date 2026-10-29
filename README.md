# Reflexis

Reflexis is a collaborative qualitative analysis tool for teams working with text corpora. It supports shared project workspaces, researcher positionality, document-level coding, a living codebook, and prompts that help teams make interpretive differences visible during analysis.

This project accompanies the CHI 2026 paper:

[Reflexis: Supporting Reflexivity and Rigour in Collaborative Qualitative Analysis through Design for Deliberation](https://doi.org/10.1145/3772318.3791275)

## Getting Started

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env.local` and add the required Firebase configuration values. Some AI-assisted features also require `OPENAI_API_KEY`.

Run the development server:

```bash
npm run dev
```

Then open the local URL shown in the terminal.

## Public demo

Share **`/demo`** on your deployment (or `http://localhost:3000/demo` locally). The sign-in screen also has an **Explore the demo** link. No account, shared password, anonymous Firebase login, database seed, or Firestore rule changes are needed.

The demo opens the full default corpus with sample codes, overlapping annotations, fictional researcher profiles, reflexive notes, and code history. Visitors can code passages, write reflections, edit the codebook, and explore the project history using the regular workspace interface.

The sample history includes **Data verification** merging into **Invisible work**, and **Feedback barriers** splitting into **Public voice** and **Technical translation**. The retired source codes remain under **Deleted Codes**. Their histories show transferred highlights and reflections, with connections in the full history graph.

Each tab keeps its own workspace in memory. Changes are not saved; refreshing or selecting **Reset demo** restores the sample workspace. Concurrent visitors and tabs never subscribe to each other’s changes. Demo operations use only the reserved `reflexis-demo` local namespace; real projects continue through Firebase with their existing access controls. AI calls are disabled in the demo. The sample collaborators and analysis are illustrative, and do not use existing account or project data.

To make the URL publicly available, deploy this version through your normal release process. The demo needs no backend migration.

A captioned [demo walkthrough](docs/demo/walkthrough.mp4), [workspace screenshot](docs/demo/workspace.png), and [browser verification report](docs/demo/verification.json) are included. The tour covers overlapping interpretations, the living codebook, discussion focus, code history, coding a passage, and saving a reflection.

To repeat browser verification, run `node scripts/demo-tour.cjs` against a local server with Playwright and its Chromium browser installed. Add `--record` to capture a WebM tour. `DEMO_BASE_URL`, `DEMO_OUTPUT_DIR`, `PLAYWRIGHT_MODULE`, and `CHROME_PATH` can override the defaults. The script verifies separate visitors and tabs, discarded edits after refresh, profile editing, and independent resets, and fails if the demo attempts a Firebase or AI request. It uses temporary browser profiles and blocks those requests during the run.

## First-Time User Guide

A GitHub-friendly walkthrough is available at:

[docs/first-time-user-infographic.md](docs/first-time-user-infographic.md)

The same guide is also available as a local HTML infographic:

[docs/first-time-user-infographic.html](docs/first-time-user-infographic.html)

## Privacy and Data Use

Reflexis uses Firebase Auth for sign-in and Firestore for project storage. Stored project data can include researcher profiles, project membership, document text, codes, highlights, reflexive notes, and related timestamps/metadata. Firestore rules limit project data access to signed-in project members, with extra controls for project owners.

Some optional AI-assisted features use the OpenAI API with `gpt-5.5`. These features may send relevant excerpts of project data, such as selected passages, code definitions, researcher positionality text, or reflexive notes, to generate summaries, discussion prompts, or conceptual-drift checks.

LLM-assisted features can be turned off in the interface from **Settings**. Deployment owners should still review Firebase, OpenAI, consent, and institutional privacy requirements before using Reflexis with participant or confidential research data.

## Citation

If you use Reflexis in research, please cite:

```bibtex
@inproceedings{ye2026reflexis,
  title={Reflexis: Supporting Reflexivity and Rigour in Collaborative Qualitative Analysis through Design for Deliberation},
  author={Ye, Runlong and Huang, Oliver and Yung Kang Lee, Patrick and Liut, Michael and Nobre, Carolina and Kong, Ha-Kyung},
  booktitle={Proceedings of the 2026 CHI Conference on Human Factors in Computing Systems},
  pages={1--31},
  year={2026}
}
```
