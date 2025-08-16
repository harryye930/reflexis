// Default documents available in the system
export const defaultDocuments = [
  {
    id: 'user-study-transcript-a',
    title: 'Participant A',
    description: 'Participant A: Policy Advisor, Digital Strategy',
    content: `Interviewer: Thanks for watching the video. First impressions?
Participant A: Yeah, I liked that it showed both the good and the awkward bits. Like, it’s neat if a car can flag trash so the streets get cleaned faster. But people seeing a car with cameras… they immediately think, “I’m being watched,” right? So that sticker “we detect trash, not people” in the video, that kind of thing helps, but it won’t solve the whole feeling.

Interviewer: You mentioned the awkward bits. What stood out?
Participant A: Honestly, the democratic part. Who decides we use these systems in the first place? That shouldn’t be purely an operational decision. It’s a political choice—council debates, the whole thing. We need the public to know that their representatives actually talked it through, not just “IT bought a fancy tool.”

Interviewer: How does that work today?
Participant A: It varies. When we run pilots, we do a lot more explaining and documenting than during “business as usual.” We do impact assessments, talk to our privacy commission, show the council what we’re trying. But after a pilot, when something moves to operations, it gets murkier. Policy changes, councils change, and the software doesn’t automatically follow. We should be better at linking new policy decisions back into the system rules.

Interviewer: And in terms of citizens contesting decisions?
Participant A: I like the video’s idea of a loop—explain, contact, discuss, decide. But let’s be real, not everyone wants to —or can—go through that. Some folks are great at writing emails and citing laws. Others just want someone to pick up the phone and fix the problem. If we rely too much on the “loud” voices, we slip into that reporting inequality issue: certain neighborhoods get more attention because they report more.

Interviewer: So how do you avoid that?
Participant A: Two ways. One, routing: keep a single front door—our central phone line—so people don’t have to guess “Is this a digital issue?” They just call, and we figure it out internally. Two, monitoring: we should look at all complaints in aggregate. If ten people complain about the same corner overflowing with trash, that should trigger a check. But we also need to look for the places where nobody complains, because those areas might still be struggling.

Interviewer: Any worries about capacity?
Participant A: Big time. Talking to people takes time. Training staff to understand algorithms takes time. Writing in the algorithm register, feeding back changes into the model… it’s all extra work. If we want contestability, we have to budget for it. Otherwise it’s just a poster on the wall.

Interviewer: If you could change one thing tomorrow?
Participant A: I’d mandate a formal step where council oversight and policy updates are wired into system updates. Like, you change the policy, you must update the business rules and log that. Then show your work—why the rule changed, who decided, when it was deployed. That’s democratic embedding plus accountability in one go.
`,
    isDefault: true,
    createdAt: new Date('2025-08-15')
  },
  {
    id: 'user-study-transcript-b',
    title: 'Participant B',
    description: 'Participant B: Contact Center Team Lead',
    content: `Interviewer: How did the concept video land for you?
Participant B: I liked that it wasn’t just “tech saves the day.” Because for us, the calls start when the tech confuses people. They see a car with cameras; they want to know what it’s doing. Some assume it’s filming faces. We have scripts, but we also need to answer in plain language, you know?

Interviewer: What do people ask?
Participant B: Three things mostly. One: “Am I being recorded?” Two: “Can I talk to a person who knows this system?” Three: “How do I challenge a bad decision?” They don’t say “algorithm” a lot. They say “the system” or “your car.” Older callers sometimes mail letters. Younger ones send long emails with screenshots. Different styles, same need: a human to hear them.

Interviewer: The video shows a “contact us” button and a discussion with a city rep. Do you see that working?
Participant B: Yes, if we keep the single number. People hate being bounced around. If it’s trash, or parking, or data protection… they still want one front door. Behind the scenes we can triage to a specialist. But please, don’t make a separate “AI helpline.” People don’t self-diagnose that way.

Interviewer: What’s hard about triage?
Participant B: Two things. One: training. My team needs enough understanding to recognize when a question is about an automated decision versus, say, a general service complaint. Two: systems. Right now, our ticketing doesn’t always link directly into the development team’s tools. So we end up forwarding emails. It works, but it’s clunky. We’d prefer logging the issue once and seeing it tracked all the way through.

Interviewer: Do you see patterns in who calls?
Participant B: Definitely. Some neighborhoods call a lot. Others barely call at all. That’s why I like the bit in the video where they check for model drift and false positives. If an area never calls, you can’t assume no problems. Maybe people there just don’t expect city hall to respond. So we can’t only react to calls; we need to analyze the data.

Interviewer: Anything you’d change in how the city handles this?
Participant B: Two small, practical things. First, more simple explanations. Like: “The car looks for shapes and colors that resemble trash, and faces are blurred before anything is stored.” Plain English. Second, call-backs from the specialists. Even if it’s a quick “we got it and here’s what will happen next,” it makes a huge difference. People want to feel heard, not like they’ve sent a message into the void.

Interviewer: And resource-wise?
Participant B: If we introduce a new system, please plan for the spike in questions. The first months are the busiest. We need extra hands, and refresher training. Otherwise we’ll drown, and the whole “contestability” idea will look good on paper but feel bad on the phone.
`,
    isDefault: true,
    createdAt: new Date('2025-08-15')
  },
  {
    id: 'user-study-transcript-c',
    title: 'Participant C',
    description: 'Participant C: ML Engineer, Urban Innovation Team',
    content: `Interviewer: What did you think of how the video portrayed the model and the risks?
Participant C: Surprisingly accurate. False positives happen—someone leaves a box for a neighbor, model says “trash.” Or a bulky waste pickup is scheduled, but the system hasn’t seen that note. And yeah, model drift is real. Seasons change, people put stuff out differently, the camera angle changes a bit… tiny things add up.

Interviewer: How do you handle that in practice?
Participant C: We’re good at pilots. We test in the field, we bring in a few residents and sanitation staff, we tune thresholds. The tricky part is feedback after launch. We don’t yet have a clean pipeline from citizen reports into improving the model. The video shows that loop; that’s where we want to go. Right now, a complaint might reach us via email. We look at images, fix a rule, maybe retrain. But it’s manual.

Interviewer: You mentioned images. What about privacy?
Participant C: We minimize by default. Faces and plates are blurred before anything gets sent to storage. Our privacy commission looked at it. And we label the cars so people know the purpose. Those things help with the “being watched” feeling, but some folks just don’t like cameras. We have to accept that and be transparent—what we collect, what we don’t, how long we keep it.

Interviewer: Metrics—how do you explain them to non-technical folks?
Participant C: Carefully. Internally we might say, “IOU of 0.8.” Externally, that sounds like 80% accuracy, which isn’t the same. So we try describing what errors look like—“roughly 2 in 10 detections might need a human check”—and we always keep a human in the loop for enforcement or dispatch. That way a model suggestion doesn’t become an automatic action.

Interviewer: Do citizens shape the model?
Participant C: In pilots, yes. We co-run workshops, show examples, ask “Would you consider this trash?” People differ! So we document those disagreements and try to encode them as rules the model can work with. After deployment, we need a structured way for citizens to flag mistakes that feeds back into retraining. That’s a gap we’re working on—linking the service desk system to our issue tracker and data labeling tool.

Interviewer: And the handover to operations?
Participant C: Ah, the innovation gap. We build, test, document. Then operations picks it up, and three months later policy changes—say, new bulky waste guidelines. Someone has to update thresholds, retrain, redeploy. If our team isn’t still involved, it stalls. Ideally, there’s a maintenance phase where we stay on, plus clear logging so anyone can see what model version made what suggestion, and why.

Interviewer: If you could improve one thing?
Participant C: Make the feedback loop “by design.” A button in the citizen portal to flag a wrong detection, a checkbox for the sanitation worker to confirm or correct the label, all flowing to a review queue. That’s contestability in a very practical sense.
`,
    isDefault: true,
    createdAt: new Date('2025-08-15')
  },
  {
    id: 'user-study-transcript-d',
    title: 'Participant D',
    description: 'Participant D: Legal Counsel, Public Services',
    content: `Interviewer: What resonated for you in the concept video?
Participant D: The bit where a person challenges a decision without going straight to court. We do have formal complaint, objection, and appeal procedures, but they’re stressful. Paper letters, deadlines, legal language—it’s not friendly. If we can resolve things earlier, with a documented conversation and a clear explanation, that’s better for everyone.

Interviewer: How does that mesh with administrative law?
Participant D: Quite well, actually. We can still keep the formal ladder—complaint, objection, appeal—while offering a low-threshold chat or mediation. Importantly, whatever we decide must be logged in the case file: what data was used, what the system suggested, what the human reviewer considered, and the final reasoning. If it goes to court, the judge can see the full picture.

Interviewer: Do you need special safeguards for AI-enabled decisions?
Participant D: We need to show a legal basis, proportionality, and necessity. Our local privacy and data commission looks at high-risk projects. And we should publish entries in our algorithm register, so people know the system exists, what it does, and who to contact. If you can’t even find out that a model is involved, you can’t contest it meaningfully.

Interviewer: What about fairness across neighborhoods?
Participant D: That’s a policy and legal issue. If the system reacts mostly to reports, and some areas report more, we risk unequal service. So we advise teams to combine complaint data with proactive monitoring. Also, if patterns suggest systematic bias, that’s a signal to revisit the rules, not just tweak the model. The council might need to set clearer policy goals here.

Interviewer: Where does current practice fall short?
Participant D: Two places. First, transparency isn’t always timely. The information people need is spread across departments, and they get bounced around. Second, case files often don’t include the algorithmic piece in a way a non-technical person can understand. Screenshots help. So does a short narrative—“The system identified X, a human checked Y, final decision Z because …”

Interviewer: Do oversight bodies have the right expertise?
Participant D: We’re getting there. Some advisory bodies are very strong on privacy but newer to algorithmic reasoning. We’re planning guidance for staff and for committee members—basic terms, typical risks, and how to read a model card, that kind of thing. Ultimately, the “finishing touch,” as a colleague says, is judicial review: if a judge can follow our trail and agrees the decision is lawful and fair.

Interviewer: One change you’d implement?
Participant D: Default to alternative dispute resolution before formal objection, and build it into the workflow and the portal. A phone call by someone empowered to adjust the decision on the spot, with a clear written follow-up. That human moment prevents a lot of escalations.
`,
    isDefault: true,
    createdAt: new Date('2025-08-15')
  },
  {
    id: 'user-study-transcript-e',
    title: 'Participant E',
    description: 'Participant E: District Sanitation Manager',
    content: `Interviewer: How did the video map to your day-to-day?
Participant E: Pretty closely. We do get heatmaps and suggested routes now for special pickups. The idea that a car feeds in trash sightings and we prioritize—that’s appealing. But I’ll be honest, the map isn’t the whole truth. My crew knows the streets. Sometimes they ignore the suggestion because a market day or a festival flipped the priorities.

Interviewer: How do people in the neighborhood react?
Participant E: Mixed. In some areas, folks call us constantly—“There’s a mattress on the corner!” Other areas, nothing, even if we know it’s messy. That’s that reporting inequality you mentioned. If we only follow the calls, we reinforce the gap. So I ask my team to log what they see, not just what’s reported. We need both.

Interviewer: The video showed false positives. Do you see those?
Participant E: Oh yeah. The car flags a pile, and it’s a charity pickup or someone moving house. We try to stop the truck from going out for nothing. Having a human check the image before dispatch helps. And we need an easy way for the driver to mark “not trash” on the spot, so it feeds back.

Interviewer: What about resources?
Participant E: Always tight. If the system tells me to send an extra truck to Area A, that truck comes from somewhere. So I want the model to learn the rhythm—like, after a holiday weekend, or when bulky waste collections happen. If we don’t have the people, all the smart maps in the world won’t fix it.

Interviewer: Do you coordinate with other departments?
Participant E: We try. But it’s fragmented. Calls might go to the district office, then to central sanitation, then to enforcement if it’s a dumping fine. The resident doesn’t care about our boxes; they want it gone. Internally, I’d love a single dashboard where calls, model suggestions, and crew feedback meet. Right now, a lot of it is email.

Interviewer: Anything you’d change in the car itself?
Participant E: Make the purpose obvious. Big text on the car—“Detecting trash, not people.” And let it show a QR code to a page with simple answers. Also, I want my crew to see the same image the car flagged, so they can confirm or correct it quickly. That’s the feedback loop.

Interviewer: Final thought?
Participant E: Use the tech, but trust the people. The model’s a great guide, but the crew on the street and the residents know things the map doesn’t. If we can bring those voices into how the system updates, we’ll get cleaner streets and fewer angry calls.
`,
    isDefault: true,
    createdAt: new Date('2025-08-15')
  }
];
