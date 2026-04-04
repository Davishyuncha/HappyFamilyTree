export interface Person {
  id: string;
  nameKorean: string;
  nameHanja?: string;
  courtesyName?: string; // 자(字)
  penName?: string; // 호(號)
  generation: number; // 세(世)
  generationChar?: string; // 항렬자
  birthDateSolar?: string;
  birthDateLunar?: string;
  deathDateSolar?: string;
  deathDateLunar?: string;
  gender: "male" | "female";
  branch?: string; // 파(派)
  profilePhoto?: string; // 대표 사진 (data URL)
  photos?: string[]; // 추가 사진들 (data URL 배열)
  bio?: string;
  position?: string; // 관직/직업
  burialLocation?: string;
  burialDirection?: string;
  burialJoint?: string; // 합장여부 (쌍조/합조 등)
  spouseClan?: string; // 배우자 본관+성씨 (예: "경주 금씨")
  isLiving: boolean;
  // 관계 참조
  fatherId?: string;
  motherId?: string;
  spouseIds?: string[];
  childrenIds?: string[];
}

export interface FamilyTree {
  clanName: string; // 가문명
  originPlace: string; // 본관
  founderName: string; // 시조 이름
  members: Person[];
}
