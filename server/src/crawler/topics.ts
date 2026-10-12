const TOPIC_WORDS =
  /materials?|metal|alloy|metallurg|steel|polymer|plastic|ceramic|glass|cement|concrete|composite|corrosion|coating|nano|graphene|batter|solar|photovoltaic|hydrogen|fuel cell|energy|sustainab|manufactur|additive|3d print|welding|semiconductor|thin film|crystal/i;
const PROGRAMME_WORDS = /\b(scholarships?|fellowships?)\b/i;

export function isOnTopicPost(title: string): boolean {
  return TOPIC_WORDS.test(title) || PROGRAMME_WORDS.test(title);
}
