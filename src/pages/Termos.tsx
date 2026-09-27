import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { Link } from "react-router-dom";

const Termos = () => (
  <LegalPage
    title="Termos de Uso"
    updatedAt="27 de setembro de 2026"
    intro="Estes Termos de Uso regulam o acesso e a utilização da plataforma ComaFacil. Ao criar uma conta ou utilizar qualquer recurso do serviço, você declara ter lido, compreendido e aceito integralmente as condições abaixo."
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
        Você é o único responsável pelas decisões alimentares que tomar com base nas informações
        apresentadas na plataforma.
      </p>
    </LegalSection>

    <LegalSection title="3. Cadastro e conta">
      <p>
        Para usar o ComaFacil é necessário criar uma conta com informações verdadeiras, completas e
        atualizadas. O cadastro é pessoal e intransferível, e você é responsável por manter a
        confidencialidade da sua senha e por todas as atividades realizadas na sua conta.
      </p>
      <p>
        O serviço é destinado a pessoas com 18 anos ou mais. Menores de idade só podem utilizar a
        plataforma com o consentimento e a supervisão de um responsável legal.
      </p>
    </LegalSection>

    <LegalSection title="4. Planos, assinaturas e período de teste">
      <p>
        O ComaFacil oferece planos de assinatura com recursos distintos. Ao contratar um plano, você
        autoriza a cobrança recorrente do valor vigente até que a assinatura seja cancelada.
      </p>
      <p>
        Novos usuários podem receber um período gratuito de 7 dias com recursos limitados. Ao final
        desse período, o acesso às funcionalidades é bloqueado até a contratação de um plano pago.
      </p>
      <p>
        Os pagamentos são processados por provedor externo de pagamentos. O ComaFacil não armazena os
        dados completos do seu cartão.
      </p>
    </LegalSection>

    <LegalSection title="5. Cancelamento e reembolso">
      <p>
        Você pode cancelar a assinatura a qualquer momento nas configurações da sua conta. O
        cancelamento interrompe as cobranças futuras e o acesso aos recursos pagos permanece
        disponível até o fim do período já pago.
      </p>
      <p>
        Nos termos do Código de Defesa do Consumidor, compras realizadas pela internet podem ser
        canceladas com reembolso integral em até 7 dias corridos a partir da contratação (direito de
        arrependimento).
      </p>
    </LegalSection>

    <LegalSection title="6. Uso permitido">
      <p>Ao utilizar a plataforma, você se compromete a não:</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>compartilhar sua conta, credenciais ou acesso com terceiros;</li>
        <li>revender, redistribuir ou explorar comercialmente os conteúdos gerados;</li>
        <li>tentar burlar limites de uso, mecanismos de cobrança ou controles de acesso;</li>
        <li>utilizar a plataforma para fins ilícitos ou que violem direitos de terceiros;</li>
        <li>coletar dados da plataforma por meios automatizados sem autorização.</li>
      </ul>
      <p>
        O descumprimento destes Termos pode resultar na suspensão ou no encerramento da conta, sem
        prejuízo das medidas legais aplicáveis.
      </p>
    </LegalSection>

    <LegalSection title="7. Conteúdo gerado por inteligência artificial">
      <p>
        Os cardápios, receitas, análises e recomendações são gerados automaticamente e podem conter
        imprecisões, valores nutricionais aproximados ou sugestões inadequadas ao seu caso
        individual. Revise sempre as informações antes de utilizá-las, em especial quanto a alergias
        e restrições alimentares.
      </p>
    </LegalSection>

    <LegalSection title="8. Propriedade intelectual">
      <p>
        A marca ComaFacil, o software, o design, os textos e os demais elementos da plataforma são
        protegidos por lei. O acesso ao serviço concede a você apenas uma licença pessoal, limitada,
        não exclusiva e revogável de uso, sem transferência de propriedade.
      </p>
    </LegalSection>

    <LegalSection title="9. Limitação de responsabilidade">
      <p>
        O serviço é oferecido no estado em que se encontra. Não garantimos disponibilidade
        ininterrupta, ausência de falhas ou resultados específicos de saúde, peso ou desempenho
        físico. Na máxima extensão permitida pela lei aplicável, não respondemos por danos
        indiretos, lucros cessantes ou consequências decorrentes de decisões alimentares tomadas com
        base no conteúdo da plataforma.
      </p>
    </LegalSection>

    <LegalSection title="10. Alterações dos Termos">
      <p>
        Estes Termos podem ser atualizados a qualquer momento para refletir mudanças legais ou no
        serviço. Alterações relevantes serão comunicadas por e-mail ou dentro da plataforma. O uso
        continuado após a atualização representa a aceitação da nova versão.
      </p>
    </LegalSection>

    <LegalSection title="11. Lei aplicável e foro">
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Eventuais
        controvérsias serão resolvidas no foro do domicílio do consumidor.
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
