// Default documents available in the system
export const defaultDocuments = [
  {
    id: 'user-study-transcript-a',
    title: 'Participant A',
    description: 'Alex - Data Science & Technical Team',
    content: `Interviewer: Thank you for your time, Alex. Now that you've seen the video, what is your initial reaction to this vision of a 'contestable' camera car system?
Participant (Alex): My first thought is that the feedback loop it shows is the hardest part of the entire thing. The idea that a citizen complaint can cleanly translate into a model improvement... that's a massive technical and procedural challenge. We can build an object detection model, sure. But building the pipeline for continuous, human-verified feedback at scale? That's an entirely different beast.
Interviewer: You mentioned it was a challenge. Could you be more specific about where the difficulty lies?
Participant (Alex): It's about data integrity. A citizen says, 'Your car missed a pile of trash.' What does that mean for the model? We'd need to get the exact location, maybe a photo from the citizen, have someone verify it's not a false report, and then correctly label that instance and add it to a retraining dataset. It's a huge data-labeling and verification task that's disguised as a customer service interaction.
Interviewer: That's a great point. Let's move to my next question. The video shows a citizen directly contacting the city and having a conversation. In your experience, how realistic is that specific interaction, and what are the biggest barriers to making that happen effectively?
Participant (Alex): From my team's perspective, the biggest barrier is translation. The citizen is speaking in plain language about a real-world problem. Our systems speak in metrics: confidence scores, Intersection over Union, precision, recall. When we try to explain why a model made a mistake, we talk about the statistical properties of its training data. That's not a conversation most people can, or should have to, engage with. So the barrier is finding someone who can bridge that gap—someone who understands both the citizen's complaint and the model's technical limitations and can translate between the two. That person barely exists.
Interviewer: That brings me to the final question. Beyond the technology, what's the single biggest change our city organization would have to make to truly support a system like this, where citizen challenges can lead to real, systemic improvements?
Participant (Alex): A change in mindset from 'project' to 'product.' We are really good at funding and building a new 'project.' We launch it, cut the ribbon, and the project team dissolves. But a system like this isn't a project; it's a living product that needs perpetual maintenance. You have to fund a permanent team to monitor for model drift, manage the retraining pipelines, analyze feedback. The biggest change would be committing to the long-term, unglamorous work of maintenance, not just the exciting work of invention. Without that, any contestability feature will decay and become useless within a year.
`,
    isDefault: true,
    createdAt: new Date('2025-08-15')
  },
  {
    id: 'user-study-transcript-b',
    title: 'Participant B',
    description: 'Ben - Legal & Policy',
    content: `Interviewer: Thanks, Ben. Now that you've seen the video, what is your initial reaction to this vision of a 'contestable' camera car system?
Participant (Ben): My gut reaction is that this frames the problem too narrowly. It presents contestability as a way to fix bugs in a system that has already been decided on. But the decision to even deploy a system like this—to conduct mass automated sensing in public space—is a deeply political one that should be contested much earlier, at the council level. It's a debate about public values, not just technical accuracy.
Interviewer: That's an important distinction. Okay, moving to the interaction itself. The video shows a citizen directly contacting the city and having a conversation. In your experience, how realistic is that specific interaction, and what are the biggest barriers to making that happen effectively?
Participant (Ben): The idea of a substantive conversation is the goal, but the biggest barrier is the power dynamic and the nature of our current processes. Right now, if you want to object to a fine from an automated system, you enter a formal, quasi-legal process. It's adversarial by nature. You're not a partner in improving the system; you're a claimant trying to prove the system wronged you. To make the video's vision a reality, we’d have to create new, non-adversarial channels for dialogue. Otherwise, only the most persistent citizens, or those with legal help, will ever be heard.
Interviewer: So the formality of the process is a barrier. What other issues do you see?
Participant (Ben): Reporting inequality. We know from existing data that more affluent communities report more. If this system relies on citizen feedback to improve, we risk creating a feedback loop that primarily serves the already well-served, while neglecting areas where people don't report due to distrust or other barriers. That's a serious equity problem.
Interviewer: Absolutely. And for the final question: Beyond the technology, what's the single biggest change our city organization would have to make to truly support a system like this, where citizen challenges can lead to real, systemic improvements?
Participant (Ben): It would be to establish clear lines of democratic accountability for these systems. Right now, an alderperson is accountable for policy, but the technical details are often in a black box. The single biggest change would be requiring every significant algorithmic system to be formally approved, reviewed, and debated by the municipal council, just like any other major city ordinance. It would force the accountability to sit with our elected officials, not just with a technical department. It would make these systems an explicit part of the democratic process.
`,
    isDefault: true,
    createdAt: new Date('2025-08-15')
  },
  {
    id: 'user-study-transcript-c',
    title: 'Participant C',
    description: 'Casey - Street-Level Operations',
    content: `Interviewer: Thanks for joining me, Casey. Now that you've seen the video, what is your initial reaction to this vision of a 'contestable' camera car system?
Participant (Casey): (Sighs) Honestly? It looks like a system designed by people who've never had to actually manage a city service or talk to an angry resident. It's clean, it's neat, and it completely ignores the messy human reality of the work we do. The technology is clever, but it feels disconnected from the ground truth of my team's daily job.
Interviewer: Let’s focus on one part of that messiness. The video shows a citizen directly contacting the city and having a conversation. In your experience, how realistic is that specific interaction, and what are the biggest barriers to making that happen effectively?
Participant (Casey): The biggest barrier is fragmentation. The citizen sees 'the city' as one thing. We are not. A citizen complaint about this garbage system could touch three different departments: the tech team that built the AI, the policy team that sets the rules for garbage collection, and my operations team that actually drives the trucks. The call comes in, and the operator has no idea who is actually empowered to solve the problem. The citizen gets bounced around, frustrated, and gives up. So, the barrier isn't a lack of willingness; it's that our own internal structure makes a simple, effective conversation almost impossible.
Interviewer: So it's about getting the right person. What makes that person so hard to find?
Participant (Casey): It's also a skills issue. The person in my department who answers the phone knows our collection routes inside and out. They know the union rules. They don't know anything about how an AI model works. They can't explain 'model drift.' They'd just be an apologetic middleman.
Interviewer: This ties into my final question. Beyond the technology, what's the single biggest change our city organization would have to make to truly support a system like this, where citizen challenges can lead to real, systemic improvements?
Participant (Casey): We would have to fundamentally change how we structure our teams. Instead of having a separate IT or innovation department that builds things and 'throws them over the wall' to us in Operations, we would need a single, integrated team. A 'Garbage Tech Service' team or something. It would have the data scientists, the policy advisor, and the operations manager all in one unit, jointly responsible for the entire service from end to end. That is the only way the feedback from the street can actually make it back to the people who can change the code and the policy. It’s a massive structural change, but without it, we'll forever be stuck in our silos.

`,
    isDefault: true,
    createdAt: new Date('2025-08-15')
  }
];
