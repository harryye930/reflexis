# Reflexis

Reflexis is a collaborative qualitative analysis tool for teams working with text corpora. It supports shared project workspaces, researcher positionality, document-level coding, a living codebook, and prompts that help teams make interpretive differences visible during analysis.

This project accompanies the CHI 2026 paper:

[Reflexis: Supporting Reflexivity and Rigor in Collaborative Qualitative Analysis though Design for Deliberation](https://doi.org/10.1145/3772318.3791275)

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

This section describes the data flows in this codebase. Deployment owners should review and adapt this statement for their institution, participants, ethics protocol, and hosting configuration.

### Data Storage

Reflexis uses Firebase for authentication and Firestore for application data.

- **Authentication:** Firebase Auth handles email/password sign-up and sign-in.
- **User profile data:** Firestore stores user IDs, email addresses, display names, profile completion state, last-seen timestamps, researcher background/positionality text, reduced researcher-background keywords, and project-specific initial views of the data.
- **Project data:** Firestore stores project names, project membership, roles, invitation keys/hashes, project settings, and member activity.
- **Research corpus data:** Firestore stores document titles, descriptions, and text content added to a project.
- **Analysis data:** Firestore stores codes, code definitions, code history, highlights/annotations, selected passages or text ranges, reflexive responses, and related metadata such as author IDs and timestamps.
- **Access model:** Firestore security rules restrict project data to signed-in project members. Project owners have additional permissions for project settings, reset/delete actions, document deletion, and member/project management.

### LLM Use

AI-assisted features use the OpenAI API through authenticated Next.js API routes. The model currently configured in the source is `gpt-5.5`.

The following features may send project or researcher content to OpenAI when invoked:

- **Research background keyword summaries:** Sends the researcher name, qualitative analysis history, background/positionality text, and project-specific initial view of the data to generate reduced keyword summaries.
- **Conceptual drift detection:** Sends the code name, current code definition, existing coded examples, a new selected passage, and surrounding context to check whether a code meaning may be shifting.
- **Discussion prompt generation:** Sends coded text, surrounding context, document title, applied codes, code definitions, researcher names, and researcher positionality/background summaries to generate a conversation starter.
- **Reflexive summary generation:** Sends reflexive responses and notes to summarize patterns in team reflection.

LLM outputs may be displayed in the interface and, depending on the workflow, may contribute to stored derived data such as reduced researcher-background keywords or updated code definitions. 

### Privacy Notes

- Do not enter participant data, sensitive personal information, or confidential research material unless your team has approval to store it in the configured Firebase project and send relevant excerpts to the configured LLM provider.
- Use a Firebase project and OpenAI account governed by the deployment owner, not shared demo credentials.
- Review Firestore rules, Firebase project settings, OpenAI data settings, institutional review requirements, and participant consent language before production use.
- Delete or reset demo projects and accounts when they are no longer needed.

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
