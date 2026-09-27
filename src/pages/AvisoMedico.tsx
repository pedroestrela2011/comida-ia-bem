import LegalPage, { LegalSection } from "@/components/legal/LegalPage";

const AvisoMedico = () => (
  <LegalPage
    title="Aviso de Responsabilidade em Saúde"
    updatedAt="27 de setembro de 2026"
    intro="Leia com atenção antes de seguir qualquer orientação alimentar gerada pelo ComaFacil."
  >
    <LegalSection title="O ComaFacil não substitui um profissional de saúde">
      <p>
        Todo o conteúdo da plataforma — cardápios, receitas, listas de compras, análises de pratos,
        pontuações e respostas do assistente — é gerado por inteligência artificial e tem finalidade
        exclusivamente informativa e educativa.
      </p>
      <p>
        O ComaFacil não realiza diagnóstico, não prescreve tratamento, não emite prescrição
        dietética e não substitui a consulta com nutricionista, médico ou outro profissional de saúde
        habilitado.
      </p>
    </LegalSection>

    <LegalSection title="Consulte um profissional antes de começar">
      <p>
        A orientação profissional é especialmente necessária se você se encaixa em qualquer uma
        destas situações:
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li>diabetes, pré-diabetes ou uso de insulina;</li>
        <li>hipertensão ou doenças cardiovasculares;</li>
        <li>doenças renais, hepáticas ou intestinais;</li>
        <li>histórico de transtornos alimentares;</li>
        <li>alergias ou intolerâncias alimentares;</li>
        <li>gestação, amamentação, infância ou idade avançada;</li>
        <li>uso contínuo de medicamentos que interagem com alimentos;</li>
        <li>preparação para competições esportivas ou dietas de alta restrição.</li>
      </ul>
    </LegalSection>

    <LegalSection title="Precisão das informações nutricionais">
      <p>
        Calorias, macronutrientes e demais valores apresentados são estimativas aproximadas, que
        variam conforme marca, porção, forma de preparo e origem dos alimentos. Não devem ser usados
        para controle clínico rigoroso, como ajuste de doses de insulina.
      </p>
      <p>
        As análises feitas a partir de fotos dependem da qualidade da imagem e podem identificar
        alimentos ou quantidades de forma incorreta. Sempre revise o resultado.
      </p>
    </LegalSection>

    <LegalSection title="Alergias e restrições">
      <p>
        Mesmo informando suas restrições no perfil, confira a lista de ingredientes de cada receita
        antes de preparar ou consumir. Em caso de reação alérgica, interrompa o consumo e procure
        atendimento médico imediatamente.
      </p>
    </LegalSection>

    <LegalSection title="Emergências">
      <p>
        O ComaFacil não é um canal de atendimento de emergência. Em caso de mal-estar grave, procure
        o serviço de urgência mais próximo ou ligue para o SAMU (192).
      </p>
    </LegalSection>

    <LegalSection title="Sua responsabilidade">
      <p>
        Ao utilizar a plataforma, você reconhece que as decisões sobre a sua alimentação são suas e
        que o ComaFacil não se responsabiliza por resultados de saúde, peso ou desempenho decorrentes
        do uso do conteúdo gerado.
      </p>
    </LegalSection>
  </LegalPage>
);

export default AvisoMedico;
