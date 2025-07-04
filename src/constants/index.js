export const appId = 'scholarmate-collab';

export const availableCodes = [
  { 
    id: 'key_insight', 
    label: 'Key Insight', 
    description: 'Mark important discoveries or realizations from the text',
    color: 'bg-blue-200', 
    textColor: 'text-blue-800' 
  },
  { 
    id: 'question', 
    label: 'Question', 
    description: 'Highlight areas that raise questions or need clarification',
    color: 'bg-yellow-200', 
    textColor: 'text-yellow-800' 
  },
  { 
    id: 'agreement', 
    label: 'Agreement', 
    description: 'Mark text you agree with or that supports your views',
    color: 'bg-green-200', 
    textColor: 'text-green-800' 
  },
  { 
    id: 'disagreement', 
    label: 'Disagreement', 
    description: 'Highlight text you disagree with or find problematic',
    color: 'bg-red-200', 
    textColor: 'text-red-800' 
  },
  { 
    id: 'important_quote', 
    label: 'Important Quote', 
    description: 'Mark significant quotes worth referencing later',
    color: 'bg-purple-200', 
    textColor: 'text-purple-800' 
  }
];

// Default documents available in the system
export const defaultDocuments = [
  {
    id: 'remote-work-analysis',
    title: 'Remote Work Study Analysis',
    description: 'Analysis of remote work trends and challenges in modern business',
    content: `The rise of remote work has fundamentally altered the landscape of modern business operations. A recent study indicates that over 60% of companies plan to maintain some form of remote work policy post-pandemic, citing benefits such as increased employee satisfaction and reduced overhead costs. However, this shift is not without its challenges. Managers often express concerns about maintaining a cohesive company culture and ensuring equitable opportunities for career advancement among remote and in-office employees. Another key area of discussion revolves around cybersecurity. With employees accessing company data from various networks, the risk of security breaches has escalated, prompting significant investment in new security protocols and employee training programs. Furthermore, the long-term psychological effects of reduced social interaction in a professional setting are still not fully understood, representing a critical area for future research. The digital divide also presents a significant hurdle, as not all employees have access to reliable high-speed internet, potentially creating a new form of workplace inequality. Addressing these multifaceted issues requires a proactive and adaptable approach from leadership.`,
    isDefault: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'climate-change-policy',
    title: 'Climate Change Policy Research',
    description: 'Research findings on climate policy effectiveness',
    content: `Recent climate policy research has revealed significant gaps between international commitments and actual implementation at the national level. The Paris Agreement, while representing unprecedented global cooperation, has struggled with enforcement mechanisms and accountability measures. Developing nations face particular challenges in balancing economic growth with environmental sustainability, often lacking the technological infrastructure necessary for rapid decarbonization. Carbon pricing mechanisms have shown mixed results across different economic contexts, with some regions experiencing substantial emission reductions while others have seen minimal impact. The role of renewable energy adoption has been crucial, with solar and wind technologies reaching cost parity with fossil fuels in many markets. However, energy storage and grid modernization remain significant barriers to widespread renewable integration. Social acceptance of climate policies varies dramatically across demographic groups, with younger populations generally more supportive of aggressive environmental measures. The economic implications of climate action continue to be debated, with some studies suggesting that early intervention would result in net economic benefits, while others warn of potential job displacement in traditional energy sectors.`,
    isDefault: true,
    createdAt: new Date('2024-01-02')
  },
  {
    id: 'education-technology',
    title: 'Educational Technology Impact Study',
    description: 'Study on the impact of technology integration in education',
    content: `The integration of technology in educational settings has accelerated dramatically, particularly following the global shift to remote learning. Digital learning platforms have demonstrated both significant potential and notable limitations in delivering quality education. Student engagement varies considerably across different technological interfaces, with interactive multimedia content generally producing higher retention rates compared to traditional lecture formats. However, the digital divide has become more pronounced, with students from lower socioeconomic backgrounds often lacking access to reliable internet connections and modern devices. Teachers have faced steep learning curves in adapting to new technological tools, with professional development programs showing varying degrees of effectiveness. Assessment methods have evolved to incorporate digital portfolios and real-time feedback systems, though concerns about academic integrity and cheating have increased. The personalization capabilities of adaptive learning systems show promise in addressing individual student needs, but implementation costs and data privacy concerns remain significant barriers. Long-term studies suggest that blended learning approaches, combining traditional and digital methods, may offer the most balanced solution for diverse learning populations.`,
    isDefault: true,
    createdAt: new Date('2024-01-03')
  }
];

// Legacy export for backward compatibility
export const sourceText = defaultDocuments[0].content;
