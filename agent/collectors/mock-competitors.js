/**
 * Mock competitors data for testing when Brave Search quota is exceeded
 */

export const mockVideoGamesCompetitors = [
  {
    name: 'Epic Games',
    domain: 'epicgames.com',
    description: 'Creator of Fortnite and Unreal Engine, major player in gaming ecosystem',
    threat_score: 9.2,
    activity_level: 'high',
    employee_count: 3200,
    industry: 'Video Games',
    funding_amount: 5000000000,
    funding_stage: 'Late Stage'
  },
  {
    name: 'Unity Technologies',
    domain: 'unity.com',
    description: 'Leading game engine platform with 50%+ market share in mobile gaming',
    threat_score: 8.8,
    activity_level: 'high',
    employee_count: 5800,
    industry: 'Video Games',
    funding_amount: 2000000000,
    funding_stage: 'Public'
  },
  {
    name: 'Roblox Corporation',
    domain: 'roblox.com',
    description: 'User-generated content platform with 70M+ daily active users',
    threat_score: 8.5,
    activity_level: 'high',
    employee_count: 2100,
    industry: 'Video Games',
    funding_amount: 520000000,
    funding_stage: 'Public'
  },
  {
    name: 'Discord',
    domain: 'discord.com',
    description: 'Gaming-first communication platform with 150M+ monthly active users',
    threat_score: 7.9,
    activity_level: 'high',
    employee_count: 600,
    industry: 'Video Games',
    funding_amount: 1000000000,
    funding_stage: 'Series H'
  },
  {
    name: 'Valve Corporation',
    domain: 'valvesoftware.com',
    description: 'Owner of Steam platform and creator of Half-Life, Portal, Dota 2',
    threat_score: 8.7,
    activity_level: 'medium',
    employee_count: 360,
    industry: 'Video Games',
    funding_amount: null,
    funding_stage: 'Private'
  },
  {
    name: 'Riot Games',
    domain: 'riotgames.com',
    description: 'Developer of League of Legends and Valorant, owned by Tencent',
    threat_score: 8.3,
    activity_level: 'high',
    employee_count: 2500,
    industry: 'Video Games',
    funding_amount: null,
    funding_stage: 'Acquired'
  },
  {
    name: 'Krafton',
    domain: 'krafton.com',
    description: 'Publisher of PUBG franchise, expanding into metaverse and NFT gaming',
    threat_score: 7.2,
    activity_level: 'medium',
    employee_count: 3500,
    industry: 'Video Games',
    funding_amount: 5000000000,
    funding_stage: 'Public'
  },
  {
    name: 'Niantic',
    domain: 'nianticlabs.com',
    description: 'AR gaming pioneer behind Pokemon GO and Ingress',
    threat_score: 6.8,
    activity_level: 'medium',
    employee_count: 1000,
    industry: 'Video Games',
    funding_amount: 730000000,
    funding_stage: 'Series C'
  },
  {
    name: 'Supercell',
    domain: 'supercell.com',
    description: 'Mobile gaming giant behind Clash of Clans and Brawl Stars',
    threat_score: 7.6,
    activity_level: 'medium',
    employee_count: 340,
    industry: 'Video Games',
    funding_amount: null,
    funding_stage: 'Acquired'
  },
  {
    name: 'miHoYo',
    domain: 'mihoyo.com',
    description: 'Chinese developer of Genshin Impact with $3B+ annual revenue',
    threat_score: 8.1,
    activity_level: 'high',
    employee_count: 4000,
    industry: 'Video Games',
    funding_amount: null,
    funding_stage: 'Private'
  },
  {
    name: 'Playtika',
    domain: 'playtika.com',
    description: 'Social casino and mobile games publisher',
    threat_score: 6.2,
    activity_level: 'medium',
    employee_count: 4200,
    industry: 'Video Games',
    funding_amount: 1900000000,
    funding_stage: 'Public'
  },
  {
    name: 'Scopely',
    domain: 'scopely.com',
    description: 'Mobile games publisher with Star Trek and Marvel titles',
    threat_score: 6.9,
    activity_level: 'high',
    employee_count: 1200,
    industry: 'Video Games',
    funding_amount: 1600000000,
    funding_stage: 'Late Stage'
  },
  {
    name: 'Gameplay Galaxy',
    domain: 'gameplaygalaxy.com',
    description: 'Web3 gaming platform connecting blockchain games',
    threat_score: 5.4,
    activity_level: 'high',
    employee_count: 85,
    industry: 'Video Games',
    funding_amount: 12000000,
    funding_stage: 'Series A'
  },
  {
    name: 'Immutable',
    domain: 'immutable.com',
    description: 'NFT and blockchain gaming infrastructure provider',
    threat_score: 6.1,
    activity_level: 'high',
    employee_count: 280,
    industry: 'Video Games',
    funding_amount: 280000000,
    funding_stage: 'Series C'
  },
  {
    name: 'Dream Games',
    domain: 'dreamgames.com',
    description: 'Turkish mobile gaming startup with Royal Match hit game',
    threat_score: 6.5,
    activity_level: 'high',
    employee_count: 250,
    industry: 'Video Games',
    funding_amount: 455000000,
    funding_stage: 'Series D'
  }
]

export function getMockCompetitors(industry) {
  if (industry.toLowerCase().includes('video') || industry.toLowerCase().includes('game')) {
    return mockVideoGamesCompetitors
  }
  
  // Fallback for other industries
  return []
}
