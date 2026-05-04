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
