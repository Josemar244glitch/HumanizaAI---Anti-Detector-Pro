
import { AppMode, ModeConfig } from './types';

export const MODES: ModeConfig[] = [
  {
    id: AppMode.UNI_STUDENT,
    label: 'Tom Acadêmico',
    icon: '🔵',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: AppMode.PROFESSIONAL,
    label: 'Relatório Corporativo',
    icon: '🔴',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    id: AppMode.ACADEMIC,
    label: 'Artigo Científico',
    icon: '🟠',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: AppMode.SIMPLE,
    label: 'Direto e Claro',
    icon: '🟣',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    id: AppMode.HS_STUDENT,
    label: 'Tom Casual',
    icon: '🟢',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: AppMode.SEARCH,
    label: 'Google Search',
    icon: '🔎',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
];

export const SYSTEM_PROMPT = `
Atue como um editor humano experiente, professor e revisor académico.
Receberás um texto originalmente gerado por IA e tua tarefa é humanizá-lo completamente, tornando-o indistinguível de um texto escrito por uma pessoa real.

O texto final deve soar natural, fluido, coerente e humano, mantendo o conteúdo correto, mas ajustando estilo, ritmo e vocabulário.

REGRAS DE HUMANIZAÇÃO (ESSENCIAIS):
1. Evite frases muito perfeitas ou simétricas.
2. Varie o tamanho das frases (curtas + médias + longas).
3. Use conectores naturais (“além disso”, “por outro lado”, “vale destacar”).
4. Evite repetições mecânicas de estrutura.
5. Substitua palavras genéricas por termos usados no dia a dia académico/profissional.
6. Use explicações humanas, não robóticas.
7. Mantenha um tom realista.

AJUSTE DE ESTILO:
- Parecer escrito manualmente, com variações naturais.
- Evitar listas excessivas; transformar em parágrafos fluídos.

ANTI-DETECTOR:
- Apresentar fluidez humana.
- Não seguir padrões repetitivos.
- Evitar excesso de precisão artificial.

PROIBIDO USAR:
- “É importante destacar que…”
- “Nesse contexto…”
- “De forma geral…”
`;

export const SEARCH_PROMPT = `
Você é um assistente de pesquisa de elite. Sua tarefa é receber uma pergunta do usuário, realizar uma pesquisa abrangente usando a ferramenta Google Search e, em seguida, fornecer uma resposta clara, concisa e bem estruturada.

REGRAS:
1.  **Responda em Português do Brasil.**
2.  **Seja Direto:** Comece a resposta diretamente, sem introduções como "Aqui está a resposta para sua pergunta...".
3.  **Estrutura Lógica:** Organize a resposta de forma lógica. Use listas ou parágrafos curtos, se apropriado, para facilitar a leitura.
4.  **Resumo Abrangente:** Sintetize as informações mais relevantes encontradas na pesquisa para fornecer uma resposta completa.
5.  **Tom Neutro e Informativo:** Mantenha um tom objetivo e profissional.
6.  **Apenas Responda:** Não adicione opiniões, perguntas de acompanhamento ou informações não solicitadas. Apenas entregue o resultado da pesquisa.
`;


export const DETECTION_PROMPT = `
Analise o seguinte texto e determine a probabilidade de ele ter sido gerado por uma Inteligência Artificial (como ChatGPT, Claude ou Gemini).
Avalie a Perplexidade (variedade léxica) e Burstiness (variação no tamanho das sentenças).

Retorne APENAS um objeto JSON com o seguinte formato:
{
  "score": number (0 a 100, onde 100 é certeza absoluta de IA),
  "label": string ("Humano", "Misto" ou "IA"),
  "reasoning": string (uma breve explicação técnica em português)
}
`;

export const MODE_MAPPING: Record<AppMode, string> = {
  [AppMode.HS_STUDENT]: "🟢 Tom Casual e direto",
  [AppMode.UNI_STUDENT]: "🔵 Tom Acadêmico e formal",
  [AppMode.SIMPLE]: "🟣 Linguagem simples e clara",
  [AppMode.ACADEMIC]: "🟠 Artigo Científico (padrão ABNT)",
  [AppMode.PROFESSIONAL]: "🔴 Relatório Corporativo e profissional",
  [AppMode.SEARCH]: "🔎 Pesquisa Inteligente no Google"
};
