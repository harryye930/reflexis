// Default documents available in the system
export const defaultDocuments = [
  {
    id: 'user-study-transcript-a',
    title: 'Participant A',
    description: 'Alex - Data Science & Technical Team',
    content: `Interviewer: Okay, so you’ve had a chance to watch the video. What are your immediate thoughts or reactions?
Participant (Alex): It’s… interesting. It’s very ambitious. It looks a lot like the kind of pilots we try to run. You know, taking a new technology and seeing how it might solve a real-world problem. The part about feedback and improving the system... that's the holy grail, really.

Interviewer: Can you say more about that? The feedback part?
Participant (Alex): Sure. I mean, we always do pilot projects with a small group of citizens. We show them the tech, we get their input. But what the video shows... a continuous loop... that's the hard part. It's one thing to get feedback in a controlled workshop. It's another to build a system that can constantly take in reports from anyone, anywhere, and actually use that information to get better.

Interviewer: What makes that so difficult?
Participant (Alex): Well, for one, who are you getting the feedback from? In our pilots, we struggle to get a diverse group. It’s often the same, uh… let’s call them ‘usual suspects.’ People who are retired, have time, are already engaged with the city. So their feedback is valuable, but it's not from the single mom working two jobs who doesn't have time for a focus group. This video assumes everyone is able and willing to participate, and that's a big assumption.

Interviewer: The video showed a pretty seamless process, from citizen complaint to system improvement.
Participant (Alex): (Laughs) Yeah, that’s the innovation fantasy, isn't it? What happens is what we call the ‘innovation gap.’ We can build a brilliant pilot. It works, everyone’s happy. But then trying to make it a permanent city service… that’s a nightmare. The pilot team moves on, and the operations department has to take it over, but they weren't involved in the design. They don't have the budget. Suddenly this agile little project hits the brick wall of bureaucracy. The video just kind of… skips that part.

Interviewer: So it's an organizational issue?
Participant (Alex): A huge one. And a resource one. That whole part about having a human representative to talk to people… that sounds lovely. But that's a person's salary. Several people, probably. Who's going to staff that? Who trains them? We're already behind on freedom of information requests by, like, two years. It's a nice idea, contestability, but it sounds expensive. Really expensive.

`,
    isDefault: true,
    createdAt: new Date('2025-08-15')
  },
  {
    id: 'user-study-transcript-b',
    title: 'Participant B',
    description: 'Ben - Legal & Policy',
    content: `Interviewer: Okay, so you’ve seen the video. What's your initial reaction from your perspective?
Participant (Ben): My first reaction is that it raises a lot of fundamental questions about democratic process. The decision to use a system like this... a camera car that automatically makes decisions about public space... that shouldn't just be a technical decision made by a department. That’s a political choice.

Interviewer: What makes it a political choice?
Participant (Ben): Because it involves values. It involves trade-offs. What are we optimizing for? A cleaner city? Efficiency? Or are we creating a city where people feel watched? Where they feel they have no say? Those are questions for the city council to debate, in public. The video sort of presents the technology as a given, and the contestation is just about fixing its mistakes. I think the contestation needs to happen before you even build the car.

Interviewer: The video did show an appeals process.
Participant (Ben): It did, and that’s important. It links into the existing structures for formal complaints and appeals, which is good. But... have you ever tried to formally appeal a parking fine? It's not a user-friendly process. It’s stressful. You’re treated like an offender from the start. We have this tendency to criminalize the citizen the moment they push back. If we're going to automate more decisions, we need to make the process of disagreeing with them much more humane and accessible. Not just a formal, legalistic procedure.

Interviewer: And what about the data itself? The system is designed to find trash more efficiently.
Participant (Ben): Right, but there's a huge fairness issue there. The paper this is based on probably mentioned it. Some communities are much more likely to report issues to the city than others. More affluent, better-educated neighborhoods will use the app, make the calls. Disadvantaged areas won't, for a lot of reasons—language barriers, distrust of government, lack of time. So if you build a system that responds directly to citizen reports, you risk just reinforcing existing inequalities. You'll end up sending the garbage trucks to the cleanest neighborhoods because that's where the reports are coming from. That's not just inefficient; it's a question of justice.

Interviewer: So who should be checking for that?
Participant (Ben): Well, that’s the role of external oversight. Like our Personal Data Commission. They would have to approve a system like this. But it requires them to have a very deep understanding not just of privacy law, but of how the algorithm actually works and what its societal impacts might be. And in the end, a judge might have to rule on it. That’s the ultimate ‘finishing touch,’ as someone in the paper said. When a judge has to decide if a decision, partly made by a machine, was fair. That's a whole new world.
`,
    isDefault: true,
    createdAt: new Date('2025-08-15')
  },
  {
    id: 'user-study-transcript-c',
    title: 'Participant C',
    description: 'Casey - Street-Level Operations',
    content: `Interviewer: Thanks for watching the video. As someone who manages teams on the ground, what's your first impression?
Participant (Casey): My first impression is, who’s going to answer the phone?

Interviewer: (Laughs) The phone?
Participant (Casey): Yeah, the phone. Or the email, or whatever. A citizen is angry because a garbage truck didn't come, or because they got a fine for leaving out a piece of furniture they thought was okay. They call the city. Who do they talk to? Right now, that call comes to a central line, and it's a lottery where it ends up. My department gets calls about parking enforcement, and we have to tell them, 'That's not us.' The citizen doesn't care about our organizational chart. They just want their problem solved. This video shows a nice, clean line of communication. The reality is a tangled mess.

Interviewer: And who would be the right person to handle that call?
Participant (Casey): I have no idea! That's the problem. The person in the video… she's understanding, she knows the system, she can explain it. That person doesn't exist. My staff… they’re great at scheduling services, managing routes. They are not AI experts. How are they supposed to explain ‘model drift’ to an angry citizen on the phone? They'd have to call the tech team, who are busy building the next thing. The citizen is left on hold. It puts my people in an impossible position.

Interviewer: So there's a skills or knowledge gap?
Participant (Casey): A massive one. It’s not just the public that needs to understand this stuff; it's our own people on the front line. And there's also the trust issue. People are already suspicious. With the parking camera cars, we get constant accusations that we're spying, that we're recording everything. We're not! The system just scans plates. But trying to explain that… it’s hard. People have already made up their minds. This video suggests a rational conversation is possible, but often you’re starting from a place of deep distrust.

Interviewer: The video implies the system would help your department be more efficient.
Participant (Casey): In theory. But what happens when the ‘heat map’ tells my team to go to a neighborhood, but my team on the ground knows that’s wrong? Maybe the map is showing leaves as garbage, or it missed a big illegal dump site on the other side of town. Who wins? The data-driven system, or the experience of the sanitation worker who’s been driving that route for 20 years? This idea that data is perfect and people are flawed… it’s dangerous. We need both. But right now, the departments that hold the data and the departments that drive the trucks barely speak the same language. It's totally siloed. We just get told what the system says, and we have to deal with the consequences.
`,
    isDefault: true,
    createdAt: new Date('2025-08-15')
  }
];
