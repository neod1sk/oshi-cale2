export const languages = ["ja", "ko"] as const;
export type Lang = (typeof languages)[number];

export function isLang(value: string): value is Lang {
  return (languages as readonly string[]).includes(value);
}

type Dict = {
  siteName: string;
  subtitle: string;
  header: {
    ja: string;
    ko: string;
  };
  headerNav: {
    top: string;
  };
  home: {
    today: string;
    thisWeek: string;
    yesterday: string;
    yesterdayEmpty: string;
    next30Days: string;
    next30DaysEmpty: string;
    more: string;
    empty: string;
    error: string;
  };
  calendar: {
    title: string;
    monthJump: string;
    oshiOnly: string;
    all: string;
    noOshi: string;
    addOshi: string;
  };
  hero: {
    eyebrow: string;
    todayBirthday: string;
    placeholder: string;
    celebrate: string;
    celebrateOnX: string;
    tweetTemplate: string; // "{NAME}" placeholder
  };
};

const dict: Record<Lang, Dict> = {
  ja: {
    siteName: "推しカレ",
    subtitle: "今日、生まれた推しがいる",
    header: { ja: "JA", ko: "KO" },
    headerNav: { top: "トップ" },
    home: {
      today: "今日の誕生日",
      thisWeek: "今週の誕生日",
      yesterday: "昨日誕生日だったアイドル",
      yesterdayEmpty: "昨日誕生日だったアイドルはいません",
      next30Days: "直近30日の誕生日",
      next30DaysEmpty: "直近30日以内の誕生日はありません",
      more: "もっと見る",
      empty: "該当するデータがありません",
      error: "データの取得に失敗しました",
    },
    calendar: {
      title: "カレンダー",
      monthJump: "月でジャンプ",
      oshiOnly: "すべて",
      all: "推しだけ表示",
      noOshi: "推しが未選択です",
      addOshi: "☆を押して推し登録",
    },
    hero: {
      eyebrow: "OSHI CALENDAR",
      todayBirthday: "今日の誕生日",
      placeholder: "仮データ",
      celebrate: "祝う",
      celebrateOnX: "Xで祝う",
      tweetTemplate: "今日は{NAME}の誕生日！おめでとう🎂",
    },
  },
  ko: {
    siteName: "오시캘",
    subtitle: "오늘 태어난 오시가 있다",
    header: { ja: "JA", ko: "KO" },
    headerNav: { top: "홈" },
    home: {
      today: "오늘의 생일",
      thisWeek: "이번 주 생일",
      yesterday: "어제 생일이었던 아이돌",
      yesterdayEmpty: "어제 생일이었던 아이돌이 없습니다",
      next30Days: "최근 30일 생일",
      next30DaysEmpty: "최근 30일 이내 생일이 없습니다",
      more: "더 보기",
      empty: "표시할 데이터가 없습니다",
      error: "데이터를 불러오지 못했습니다",
    },
    calendar: {
      title: "캘린더",
      monthJump: "월 이동",
      oshiOnly: "전체 보기",
      all: "오시만 보기",
      noOshi: "최애가 선택되지 않았습니다",
      addOshi: "☆로 최애 등록",
    },
    hero: {
      eyebrow: "OSHI CALENDAR",
      todayBirthday: "오늘의 생일",
      placeholder: "샘플",
      celebrate: "축하",
      celebrateOnX: "X에서 축하",
      tweetTemplate: "오늘은 {NAME} 생일! 축하해요 🎂",
    },
  },
};

export function t(lang: Lang): Dict {
  return dict[lang];
}

