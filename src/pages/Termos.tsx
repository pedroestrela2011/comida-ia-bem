import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { Link } from "react-router-dom";

const Termos = () => (
  <LegalPage
    title="Termos de Uso"
    updatedAt="18 de novembro de 2026"
    intro="Estes Termos de Uso regulam o acesso e a utilização da plataforma ComaFacil. Ao criar uma conta ou utilizar qualquer recurso do serviço, você declara ter lido, compreendido e aceito as condições abaixo."
  >
    <LegalSection title="1. Quem somos">
      <p>
        ComaFacil é uma plataforma digital de apoio à alimentação saudável que utiliza inteligência
        artificial para gerar cardápios, receitas, listas de compras, análises de pratos e
        acompanhamento de progresso alimentar.
      </p>
      <p>
        Contato oficial para dúvidas, solicitações e suporte:{" "}
        <a href="mailto:contato@comafacil.com.br" className="text-primary underline">
          contato@comafacil.com.br
        </a>
        .
      </p>
    </LegalSection>

    <LegalSection title="2. Aviso importante de saúde">
      <p>
        O ComaFacil <strong>não é um serviço médico e não substitui a consulta ou o acompanhamento
        de nutricionista, médico ou qualquer outro profissional de saúde habilitado</strong>. Os
        conteúdos gerados pela inteligência artificial têm caráter informativo e educativo.
      </p>
      <p>
        Pessoas com diabetes, hipertensão, doenças renais, cardíacas ou hepáticas, transtornos
        alimentares, alergias e intolerâncias alimentares, além de gestantes, lactantes, crianças e
        idosos, devem consultar um profissional de saúde antes de adotar qualquer sugestão da
        plataforma. Em caso de emergência, procure atendimento médico imediato.
      </p>
      <p>
        Você é responsável por avaliar as informações apresentadas e buscar orientação profissional
        quando necessário. Esta disposição não exclui direitos ou responsabilidades que não possam
        ser afastados pela legislação aplicável.
      </p>
    </LegalSection>

    <LegalSection title="3. Cadastro, idade mínima e conta">
      <p>
        O ComaFacil é destinado a pessoas com <strong>12 anos completos ou mais</strong>. Não é
        permitido criar ou utilizar uma conta se você ainda não completou 12 anos.
      </p>
      <p>
        Usuários de 12 a 17 anos podem utilizar a plataforma, observadas as medidas de proteção
        adequadas à sua idade e a legislação brasileira sobre os direitos de crianças e adolescentes
        e a proteção de dados pessoais.
      </p>
      <p>
        Para usar o ComaFacil é necessário criar uma conta com informações verdadeiras, completas e
        atualizadas, incluindo a data de nascimento. O cadastro é pessoal e o usuário deverá manter
        suas credenciais protegidas e comunicar qualquer uso não autorizado da conta.
      </p>
      <p>
        A informação da data de nascimento poderá ser utilizada para aplicar as regras de acesso e
        proteção adequadas à faixa etária. A plataforma poderá adotar medidas proporcionais para
        verificar a idade, respeitando a legislação e evitando a coleta excessiva de dados.
      </p>
    </LegalSection>

    <LegalSection title="4. Planos, assinaturas e período de teste">
      <p>
        O ComaFacil oferece planos de assinatura com recursos distintos. Ao contratar um plano, a
        pessoa responsável pela contratação autoriza a cobrança recorrente do valor vigente até que
        a assinatura seja cancelada.
      </p>
      <p>
        Usuários menores de 18 anos não poderão concluir diretamente a contratação de planos pagos.
        A contratação para uma conta de adolescente deverá ser iniciada por um responsável adulto
        por meio de um link individual, com validade limitada e uso único. O adulto deverá informar
        seus dados, declarar que tem mais de 18 anos e que é pai, mãe ou responsável legal, e concluir
        o pagamento em seu próprio nome, sem precisar criar uma conta ComaFacil.
      </p>
      <p>
        O fluxo registra os dados e a declaração do adulto, mas não realiza, por si só, verificação
        documental automática do vínculo familiar ou da autoridade legal. A plataforma poderá
        solicitar informações adicionais quando necessário. Enquanto o fluxo não estiver implantado
        e habilitado no ambiente de produção, a contratação paga por meio da conta do adolescente
        permanecerá indisponível.
      </p>
      <p>
        Usuários adultos podem receber um período gratuito de 7 dias com recursos limitados.
        Usuários de 12 a 17 anos permanecem no acesso gratuito básico sem expiração desse período.
        O acesso a recursos de planos pagos para adolescentes depende da contratação válida por um
        responsável adulto.
      </p>
      <p>
        Os pagamentos são processados por provedor externo de pagamentos. O ComaFacil não armazena os
        dados completos do cartão. As condições e os valores serão apresentados antes da contratação.
      </p>
    </LegalSection>

    <LegalSection title="5. Cancelamento e reembolso">
      <p>
        A pessoa responsável pela assinatura pode solicitar o cancelamento a qualquer momento
        nas configurações da conta, quando disponíveis para o titular, ou pelo canal de suporte
        indicado na plataforma. Quando a contratação tiver sido feita por responsável adulto sem
        conta ComaFacil, o cancelamento deverá ser solicitado pelo responsável pelo canal de suporte,
        com dados suficientes para localizar a assinatura. O cancelamento
        interrompe as cobranças futuras e o acesso aos recursos pagos permanece disponível até o fim
        do período já pago, salvo informação diferente apresentada no momento da contratação.
      </p>
      <p>
        Nos termos do Código de Defesa do Consumidor, compras realizadas fora do estabelecimento
        comercial podem ser canceladas no prazo legal de 7 dias corridos, contado da contratação ou
        do recebimento do serviço, conforme aplicável, com a devolução dos valores pagos nos termos
        da legislação.
      </p>
    </LegalSection>

    <LegalSection title="6. Uso permitido">
      <p>Ao utilizar a plataforma, você se compromete a não:</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>compartilhar credenciais ou permitir uso indevido da conta por terceiros;</li>
        <li>revender, redistribuir ou explorar comercialmente os conteúdos gerados sem autorização;</li>
        <li>tentar burlar limites de uso, mecanismos de cobrança ou controles de acesso;</li>
        <li>utilizar a plataforma para fins ilícitos ou que violem direitos de terceiros;</li>
        <li>coletar dados da plataforma por meios automatizados sem autorização;</li>
        <li>tentar acessar sistemas, contas ou informações sem autorização.</li>
      </ul>
      <p>
        O descumprimento destes Termos poderá resultar em medidas proporcionais, incluindo
        restrição de funcionalidades, suspensão ou encerramento da conta, respeitados os direitos
        do consumidor e a legislação aplicável.
      </p>
    </LegalSection>

    <LegalSection title="7. Conteúdo gerado por inteligência artificial">
      <p>
        Os cardápios, receitas, análises e recomendações são gerados com auxílio de inteligência
        artificial e podem conter imprecisões, valores nutricionais aproximados ou sugestões
        inadequadas ao caso individual. Revise as informações antes de utilizá-las, especialmente
        quanto a alergias, intolerâncias, restrições alimentares e condições de saúde.
      </p>
      <p>
        A plataforma não garante resultados específicos e suas respostas não substituem avaliação
        individual por profissional habilitado.
      </p>
    </LegalSection>

    <LegalSection title="8. Propriedade intelectual">
      <p>
        A marca ComaFacil, o software, o design, os textos e os demais elementos da plataforma são
        protegidos por lei. O acesso ao serviço concede ao usuário apenas uma licença pessoal,
        limitada, não exclusiva e revogável de uso, sem transferência de propriedade.
      </p>
    </LegalSection>

    <LegalSection title="9. Segurança e proteção das informações">
      <p>
        O ComaFacil adotará e manterá, dentro de suas possibilidades e de forma proporcional à
        natureza das informações tratadas e aos riscos envolvidos, medidas técnicas e administrativas
        razoáveis para proteger os dados pessoais e as informações dos usuários contra acessos não
        autorizados e situações acidentais ou ilícitas de perda, alteração, destruição ou divulgação.
      </p>
      <p>
        Essas medidas poderão incluir controles de acesso, proteção de credenciais, atualização de
        sistemas, monitoramento e revisão de práticas de segurança, conforme aplicável à estrutura
        técnica e operacional do serviço. O ComaFacil buscará corrigir vulnerabilidades identificadas
        e aprimorar continuamente suas medidas de proteção.
      </p>
      <p>
        Nenhum serviço conectado à internet pode garantir segurança absoluta contra todos os
        incidentes, ataques ou falhas. Por isso, o ComaFacil não promete risco zero de acesso
        indevido ou vazamento. Essa ressalva não afasta o dever de adotar as medidas de segurança
        exigidas pela legislação nem limita os direitos dos usuários. Caso ocorra incidente de
        segurança que possa acarretar risco ou dano relevante, serão adotadas as providências e
        comunicações exigidas pela legislação aplicável.
      </p>
    </LegalSection>

    <LegalSection title="10. Disponibilidade e responsabilidade">
      <p>
        O ComaFacil busca manter seus serviços disponíveis e funcionando adequadamente, mas poderão
        ocorrer interrupções, falhas técnicas, manutenções ou indisponibilidades.
      </p>
      <p>
        Nada nestes Termos exclui ou limita responsabilidades que não possam ser afastadas pela
        legislação brasileira, especialmente os direitos assegurados pelo Código de Defesa do
        Consumidor.
      </p>
    </LegalSection>

    <LegalSection title="11. Alterações dos Termos">
      <p>
        Estes Termos poderão ser atualizados para refletir mudanças legais ou no serviço. Alterações
        relevantes serão comunicadas por e-mail ou dentro da plataforma, quando aplicável. A versão
        vigente ficará disponível para consulta.
      </p>
    </LegalSection>

    <LegalSection title="12. Lei aplicável e foro">
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Eventuais
        controvérsias serão resolvidas no foro do domicílio do consumidor, quando aplicável,
        respeitadas as disposições legais.
      </p>
      <p>
        Consulte também nossa{" "}
        <Link to="/privacidade" className="text-primary underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </LegalSection>
  </LegalPage>
);

export default Termos;
