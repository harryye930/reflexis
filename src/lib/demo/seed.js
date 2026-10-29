import { defaultDocuments } from '../../constants/defaultDocuments.js';
import { defaultCodes } from '../../constants/defaultCodes.js';
import { formatResearchBackgroundForStorage } from '../../constants/researchBackground.js';

export const DEMO_PROJECT_ID = 'reflexis-demo';
export const DEMO_USER_ID = 'demo-visitor';
export const isDemoProject = (id) => id === DEMO_PROJECT_ID;
export const demoUser = { uid: DEMO_USER_ID, displayName: 'Sam (demo visitor)' };
export const demoProject = {
  id: DEMO_PROJECT_ID,
  name: 'Demo workspace',
  membership: { role: 'owner' }
};

// Fictional researchers and illustrative analysis of the existing starter corpus.
// No account, project, or research data is copied from Firebase.
export function createDemoSeed() {
  const records = {};
  const root = `projects/${DEMO_PROJECT_ID}`;
  const now = Date.now();
  const date = (hours = 0) => new Date(now - (48 - hours) * 3600000);
  const put = (collection, id, data) => { records[`${root}/${collection}/${id}`] = data; };
  const people = [
    [DEMO_USER_ID, 'Sam (demo visitor)', '#3b86cb', 'Human-computer interaction researcher using thematic analysis.', 'I tend to look for opportunities to improve the design of public services.', 'I notice a tension between technical feedback and meaningful public influence.'],
    ['demo-maya', 'Maya Chen', '#9e4db6', 'Qualitative researcher studying civic participation and public policy.', 'My community advocacy work makes me attentive to whose voice gets heard.', 'A complaint channel is only useful if people can influence what happens next.'],
    ['demo-jordan', 'Jordan Ellis', '#3b867a', 'Data scientist studying the maintenance of public-sector AI systems.', 'My engineering experience may draw me toward technical feasibility.', 'The interviews show how much invisible work is needed to sustain contestability.']
  ];
  people.forEach(([userId, name, color, history, background, initialDataView]) => put('members', userId, {
    userId, name, color, role: userId === DEMO_USER_ID ? 'owner' : 'member',
    profileCompleted: true, initialDataView,
    researchBackground: formatResearchBackgroundForStorage(history, background, initialDataView),
    reducedResearchBackground: history, lastSeen: date(),
    preferences: { disableLlm: true, disableCodeDriftDetection: true }
  }));
  defaultDocuments.forEach((document) => put('documents', document.id, {
    ...document, createdAt: date(), createdBy: 'system'
  }));
  const initialInvisibleWorkDefinition = 'Technical work behind citizen feedback.';
  const codes = [
    ...defaultCodes.map(code => ({ ...code, createdBy: DEMO_USER_ID })),
    { id: 'invisible_work', label: 'Invisible work', description: 'The verification, translation, and ongoing maintenance work needed to make contestability possible.', color: 'bg-purple-200', textColor: 'text-purple-800', createdBy: 'demo-jordan' },
    { id: 'public_voice', label: 'Public voice', description: 'Who can challenge an automated decision, be heard, and shape the response.', color: 'bg-green-200', textColor: 'text-green-800', createdBy: 'demo-maya' },
    { id: 'institutional_change', label: 'Institutional change', description: 'Changes to organisational roles, funding, or decision-making needed for meaningful contestability.', color: 'bg-yellow-200', textColor: 'text-yellow-800', createdBy: DEMO_USER_ID },
    { id: 'technical_translation', label: 'Technical translation', description: 'Bridging lived experience and the language, metrics, and processes of an AI system.', color: 'bg-pink-200', textColor: 'text-pink-800', createdBy: 'demo-jordan' },
    { id: 'data_verification', label: 'Data verification', description: 'The work of checking citizen reports before they become training data.', color: 'bg-blue-200', textColor: 'text-blue-800', createdBy: 'demo-jordan' },
    { id: 'feedback_barriers', label: 'Feedback barriers', description: 'Obstacles that prevent citizens’ concerns from reaching people who can act on them.', color: 'bg-orange-200', textColor: 'text-orange-800', createdBy: 'demo-maya' }
  ];
  codes.forEach((code, i) => {
    put('codes', code.docId || `demo-${code.id}`, { ...code, createdAt: date(i) });
    put('code_history', `create-${code.id}`, {
      codeId: code.id, type: 'create', userId: code.createdBy, user: code.createdBy,
      description: `Code "${code.label}" created`,
      changes: { ...code, description: code.id === 'invisible_work' ? initialInvisibleWorkDefinition : code.description }, timestamp: date(i)
    });
  });
  const passage = (id, documentIndex, text, code, userId, hour) => {
    const document = defaultDocuments[documentIndex];
    const startIndex = document.content.indexOf(text);
    if (startIndex === -1) throw new Error(`Demo passage missing from ${document.title}: ${text}`);
    put('highlights', id, {
      documentId: document.id, documentTitle: document.title, text, code, userId,
      startIndex, endIndex: startIndex + text.length, createdAt: date(hour)
    });
    put('code_history', `apply-${id}`, {
      codeId: code, type: 'apply', userId, user: userId, timestamp: date(hour),
      description: `Code applied to ${document.title}`,
      changes: { documentId: document.id, documentTitle: document.title }
    });
  };
  const shared = "It's a huge data-labeling and verification task that's disguised as a customer service interaction.";
  passage('demo-work-jordan', 0, shared, 'invisible_work', 'demo-jordan', 8);
  passage('demo-work-maya', 0, shared, 'public_voice', 'demo-maya', 9);
  passage('demo-work-sam', 0, shared, 'invisible_work', DEMO_USER_ID, 10);
  passage('demo-translation', 0, "The citizen is speaking in plain language about a real-world problem. Our systems speak in metrics: confidence scores, Intersection over Union, precision, recall.", 'technical_translation', 'demo-jordan', 11);
  passage('demo-maintenance', 0, 'The biggest change would be committing to the long-term, unglamorous work of maintenance, not just the exciting work of invention.', 'institutional_change', DEMO_USER_ID, 12);
  passage('demo-maintenance-jordan', 0, 'The biggest change would be committing to the long-term, unglamorous work of maintenance, not just the exciting work of invention.', 'invisible_work', 'demo-jordan', 13);
  passage('demo-policy', 1, "It's a debate about public values, not just technical accuracy.", 'public_voice', 'demo-maya', 14);
  passage('demo-dialogue', 1, 'we’d have to create new, non-adversarial channels for dialogue.', 'institutional_change', DEMO_USER_ID, 15);
  // Add a coding to each remaining interview so browsing the whole corpus is useful.
  defaultDocuments.slice(2).forEach((document, index) => {
    const line = document.content.split('\n').find(text => text.startsWith('Participant'));
    if (line) passage(`demo-interview-${index}`, index + 2, line, 'noteworthy', 'demo-maya', 16 + index);
  });
  // These passages begin under earlier codes, before the sample merge and split below.
  passage('demo-verification', 0, "have someone verify it's not a false report", 'data_verification', 'demo-jordan', 16);
  passage('demo-feedback-access', 1, 'Otherwise, only the most persistent citizens, or those with legal help, will ever be heard.', 'feedback_barriers', 'demo-maya', 17);
  passage('demo-feedback-translation', 2, "They don't know anything about how an AI model works. They can't explain 'model drift.'", 'feedback_barriers', 'demo-jordan', 18);
  const note = (id, highlightId, type, response, hour) => {
    const highlight = records[`${root}/highlights/${highlightId}`];
    put('reflexive_responses', id, {
      highlightId, codeId: highlight.code, documentId: highlight.documentId,
      userId: highlight.userId, sourceText: highlight.text, selectedText: highlight.text,
      codeLabel: codes.find(code => code.id === highlight.code)?.label, promptType: type,
      reflexiveLensId: `lens-${highlightId}`, response, createdAt: date(hour), updatedAt: date(hour)
    });
  };
  note('note-jordan-1', 'demo-work-jordan', 'justification', '“Disguised as a customer service interaction” makes the hidden labour explicit: verification and labelling sit behind a simple complaint.', 18);
  note('note-jordan-2', 'demo-work-jordan', 'positionality', 'Having maintained data pipelines, I immediately see operational work. That experience may make me treat a political question as an engineering problem.', 19);
  note('note-maya-1', 'demo-work-maya', 'justification', 'I read this same passage as a question about public voice: does a complaint count only when it becomes useful training data?', 20);
  note('note-maya-2', 'demo-work-maya', 'alternative', 'Jordan’s “Invisible work” captures the implementation burden. We should also ask what happens to concerns that cannot be translated into labels.', 21);
  note('note-sam', 'demo-work-sam', 'alternative', 'Our overlapping codes reveal two scales of analysis: the work of processing a complaint and the citizen’s ability to change the system. Both may matter.', 22);
  note('note-policy', 'demo-policy', 'positionality', 'My policy background draws me toward decisions made before deployment. I want to avoid assuming that a better feedback interface resolves the question of whether the system should exist.', 23);
  put('code_history', 'refine-invisible-work', {
    codeId: 'invisible_work', type: 'update', userId: 'demo-jordan', user: 'demo-jordan',
    timestamp: date(24), description: 'Code "Invisible work" definition refined after team discussion',
    changes: { description: { from: initialInvisibleWorkDefinition, to: codes.find(code => code.id === 'invisible_work').description } }
  });
  note('note-verification', 'demo-verification', 'justification', 'Verifying a report takes staff time before it can improve a model. I see this as part of the less visible work of keeping the service running.', 25);
  note('note-feedback-access', 'demo-feedback-access', 'positionality', 'My community advocacy background makes me attend to who can persist with a formal complaint. This seems more about public voice than translating technical language.', 26);
  note('note-feedback-translation', 'demo-feedback-translation', 'justification', 'The person knows the service but cannot explain the model. This looks like a translation barrier, which may need its own code alongside barriers to being heard.', 27);

  // Use the same history shapes as real merge/split operations, on both sides of
  // each operation, so code histories and the graph can show their connections.
  const codeSnapshot = (id) => {
    const { label, description, color, textColor } = codes.find(code => code.id === id);
    return { id, label, description, color, textColor };
  };
  const history = (id, codeId, type, userId, hour, description, changes) => put('code_history', id, {
    codeId, type, userId, user: userId, timestamp: date(hour), description, changes
  });
  const transfer = (highlightId, targetCode, hour) => {
    const highlight = records[`${root}/highlights/${highlightId}`];
    highlight.code = targetCode.id;
    highlight.updatedAt = date(hour);
    Object.entries(records).forEach(([path, response]) => {
      if (path.startsWith(`${root}/reflexive_responses/`) && response.highlightId === highlightId) {
        Object.assign(response, { codeId: targetCode.id, codeLabel: targetCode.label, updatedAt: date(hour) });
      }
    });
  };
  const retire = (id, userId, hour, deletionReason, extra = {}) => {
    Object.assign(records[`${root}/codes/demo-${id}`], {
      isDeleted: true, deletedAt: date(hour), deletedBy: userId, deletionReason, ...extra
    });
  };

  const verification = codeSnapshot('data_verification');
  const invisibleWork = codeSnapshot('invisible_work');
  const sourceCodes = [verification, invisibleWork];
  transfer('demo-verification', invisibleWork, 30);
  retire(verification.id, 'demo-jordan', 30, 'Merged into Invisible work after the team grouped verification with other maintenance work.', { targetCodeId: invisibleWork.id });
  history('merge-verification-source', verification.id, 'merge_and_delete', 'demo-jordan', 30,
    'Code "Data verification" merged into "Invisible work" and deleted', {
      strategy: 'merge_into_invisible_work', targetCode: invisibleWork, targetCodeId: invisibleWork.id,
      sourceCodes, highlightTransferCount: 1, reflexiveResponseTransferCount: 1, mergeOperation: true, deleted: true
    });
  history('merge-invisible-work', invisibleWork.id, 'merge', 'demo-jordan', 30.1,
    'Code "Data verification" merged into "Invisible work"', {
      strategy: 'merge_into_invisible_work', sourceCodeIds: sourceCodes.map(code => code.id), sourceCodes,
      resultConfig: invisibleWork, highlightTransferCount: 1, reflexiveResponseTransferCount: 1, deleteSourceCodes: true
    });

  const feedbackBarriers = codeSnapshot('feedback_barriers');
  const publicVoice = codeSnapshot('public_voice');
  const technicalTranslation = codeSnapshot('technical_translation');
  const splitTargets = [publicVoice, technicalTranslation];
  transfer('demo-feedback-access', publicVoice, 34);
  transfer('demo-feedback-translation', technicalTranslation, 34);
  retire(feedbackBarriers.id, 'demo-maya', 34, 'Split into Public voice and Technical translation to distinguish access to dialogue from the work of explaining AI.');
  history('split-feedback-barriers', feedbackBarriers.id, 'split_and_delete', 'demo-maya', 34,
    'Code "Feedback barriers" split into 2 codes: Public voice, Technical translation', {
      sourceCode: feedbackBarriers, targetCodes: splitTargets, reassignmentCount: 2,
      highlightTransferCount: 2, reflexiveResponseTransferCount: 2, reflexiveResponsesDeleted: 0, codeDeleted: true
    });
  splitTargets.forEach((targetCode, index) => history(`split-received-${targetCode.id}`, targetCode.id, 'split', 'demo-maya', 34.1 + index * .1,
    `Code "${targetCode.label}" received 1 highlight from split of "Feedback barriers"`, {
      sourceCode: feedbackBarriers, highlightsReceived: 1, reflexiveResponsesReceived: 1, splitOperation: true
    }));
  return records;
}
