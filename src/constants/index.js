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
  },
  {
    id: 'social-media-mental-health',
    title: 'Social Media & Mental Health Research',
    description: 'Comprehensive study on social media\'s impact on mental health across age groups',
    content: `Recent longitudinal studies have established complex relationships between social media usage patterns and mental health outcomes across different demographic groups. Adolescents aged 13-18 show the strongest correlation between excessive social media use and symptoms of anxiety and depression, with Instagram and TikTok usage being particularly associated with body image issues and social comparison behaviors. However, the relationship is not uniformly negative - platforms that facilitate genuine social connection and community building, such as Discord and certain Facebook groups, demonstrate positive mental health outcomes for isolated individuals. The phenomenon of "doom scrolling" has emerged as a significant concern, with users reporting increased feelings of helplessness and anxiety after prolonged exposure to negative news content. Interestingly, older adults (50+) show different usage patterns and psychological responses, often using social media primarily for family connection and showing lower rates of platform-induced stress. The role of algorithmic content curation in shaping user experience cannot be understated, with recommendation systems often creating echo chambers that can amplify both positive and negative psychological states. Recent interventions focused on digital wellness education and platform design modifications show promising results in mitigating harmful effects while preserving beneficial social connections.`,
    isDefault: true,
    createdAt: new Date('2024-01-04')
  },
  {
    id: 'urban-planning-sustainability',
    title: 'Sustainable Urban Planning Analysis',
    description: 'Research on sustainable city development and urban planning strategies',
    content: `Contemporary urban planning faces unprecedented challenges as global urbanization accelerates and climate change intensifies. The concept of "15-minute cities" has gained traction among urban planners, proposing that essential services should be accessible within a 15-minute walk or bike ride from any residential area. This approach has shown success in cities like Paris and Melbourne, where reduced car dependency has led to improved air quality and increased community social cohesion. Green infrastructure implementation, including urban forests, green roofs, and permeable pavements, has demonstrated measurable benefits in stormwater management and urban heat island reduction. However, gentrification concerns arise when sustainable development initiatives inadvertently increase property values, displacing long-term residents. Mixed-use development strategies have proven effective in creating vibrant, walkable neighborhoods, though zoning law reforms are often required to implement such designs. Transit-oriented development around public transportation hubs has shown success in reducing overall carbon emissions while improving economic opportunities for residents. The integration of smart city technologies, including IoT sensors for traffic management and energy optimization, presents both opportunities for efficiency gains and concerns about data privacy and digital equity among diverse urban populations.`,
    isDefault: true,
    createdAt: new Date('2024-01-05')
  },
  {
    id: 'ai-ethics-governance',
    title: 'AI Ethics and Governance Framework',
    description: 'Analysis of ethical considerations and governance challenges in AI development',
    content: `The rapid advancement of artificial intelligence technologies has outpaced the development of ethical frameworks and regulatory mechanisms necessary for responsible deployment. Algorithmic bias presents one of the most pressing challenges, with documented cases of discriminatory outcomes in hiring systems, criminal justice risk assessment tools, and healthcare diagnostic algorithms. The lack of diversity in AI development teams has been identified as a contributing factor to these biases, highlighting the need for more inclusive practices in the technology sector. Privacy concerns have intensified with the proliferation of AI systems that require vast amounts of personal data for training and operation. The European Union's GDPR has established important precedents for data protection, but enforcement remains inconsistent across different jurisdictions and technological applications. Transparency in AI decision-making processes, often referred to as "explainable AI," has become a critical requirement for high-stakes applications such as medical diagnosis and financial lending. However, the complexity of modern neural networks often makes complete transparency technically challenging. International cooperation on AI governance faces significant obstacles due to varying national priorities, with some countries prioritizing innovation and economic competitiveness while others emphasize safety and ethical considerations. The development of global standards for AI ethics will require unprecedented collaboration between technologists, policymakers, and civil society organizations.`,
    isDefault: true,
    createdAt: new Date('2024-01-06')
  }
];

// Legacy export for backward compatibility
export const sourceText = defaultDocuments[0].content;
