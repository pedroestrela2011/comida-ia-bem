import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { Link } from "react-router-dom";

const Privacidade = () => (
  <LegalPage
    title="Política de Privacidade"
    updatedAt="27 de setembro de 2026"
    intro="Esta Política explica como o ComaFacil coleta, utiliza, armazena, compartilha e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD)."
  >
    <LegalSection title="1. Quem é o controlador dos dados">
      <p>
        O ComaFacil é o controlador dos dados pessoais tratados na plataforma. Para exercer seus
        direitos ou esclarecer dúvidas sobre privacidade, entre em contato:{" "}
        <a href="mailto:privacidade@comafacil.com.br" className="text-primary underline">
          privacidade@comafacil.com.br
        </a>
        .
      </p>
    </LegalSection>

    <LegalSection title="2. Quais dados coletamos">
      <p>
        <strong>Dados de cadastro:</strong> nome, e-mail, data de nascimento e país.
      </p>
      <p>
        <strong>Dados de saúde e alimentação (dados sensíveis):</strong> peso, altura, nível de
        atividade física, objetivos, restrições e preferências alimentares, alergias, intolerâncias e
        condições de saúde informadas por você, como diabetes ou hipertensão.
      </p>
      <p>
        <strong>Conteúdo enviado:</strong> fotos de pratos, textos de refeições, documentos de planos
        alimentares e mensagens trocadas com o assistente.
      </p>
      <p>
        <strong>Dados de uso:</strong> cardápios gerados, receitas salvas, downloads, registros de
        progresso, pontuações e histórico de atividades na plataforma.
      </p>
      <p>
        <strong>Dados de pagamento:</strong> status da assinatura e identificadores de cobrança. Os
        dados completos do cartão são tratados exclusivamente pelo provedor de pagamentos e não são
        armazenados por nós.
      </p>
    </LegalSection>

    <LegalSection title="3. Consentimento para dados sensíveis">
      <p>
        Dados de saúde são considerados sensíveis pela LGPD e são tratados com base no seu
        consentimento livre, informado e específico, fornecido quando você preenche o questionário de
        saúde. O objetivo exclusivo é personalizar as sugestões alimentares e emitir alertas
        relevantes ao seu perfil.
      </p>
      <p>
        Você pode revogar o consentimento a qualquer momento. A revogação pode limitar ou impedir a
        personalização dos recursos da plataforma.
      </p>
    </LegalSection>

    <LegalSection title="4. Para que usamos seus dados">
      <ul className="list-disc pl-5 space-y-2">
        <li>criar e administrar sua conta e autenticar o acesso;</li>
        <li>gerar cardápios, receitas, listas de compras e análises personalizadas;</li>
        <li>emitir alertas de saúde relacionados às condições que você informou;</li>
        <li>processar assinaturas, cobranças e controlar limites de cada plano;</li>
        <li>enviar comunicações operacionais sobre a sua conta e o serviço;</li>
        <li>prevenir fraudes, abusos e garantir a segurança da plataforma;</li>
        <li>melhorar a qualidade do serviço a partir de dados agregados e estatísticos.</li>
      </ul>
    </LegalSection>

    <LegalSection title="5. Com quem compartilhamos">
      <p>
        Compartilhamos dados apenas com operadores necessários ao funcionamento do serviço, sempre
        limitados à finalidade contratada:
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li>provedor de infraestrutura, banco de dados e autenticação;</li>
        <li>provedores de inteligência artificial, para gerar os conteúdos solicitados;</li>
        <li>provedor de pagamentos, para processar assinaturas;</li>
        <li>provedor de envio de e-mails transacionais;</li>
        <li>autoridades públicas, quando houver obrigação legal ou ordem judicial.</li>
      </ul>
      <p>
        <strong>Nunca vendemos seus dados pessoais</strong> nem os utilizamos para publicidade de
        terceiros.
      </p>
    </LegalSection>

    <LegalSection title="6. Transferência internacional">
      <p>
        Alguns de nossos provedores podem processar dados em servidores localizados fora do Brasil.
        Nesses casos, exigimos garantias contratuais de proteção compatíveis com o nível exigido pela
        LGPD.
      </p>
    </LegalSection>

    <LegalSection title="7. Por quanto tempo guardamos">
      <p>
        Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta, os dados
        pessoais são eliminados ou anonimizados, exceto registros que devam ser conservados por
        obrigação legal, fiscal ou para defesa em processos.
      </p>
    </LegalSection>

    <LegalSection title="8. Segurança">
      <p>
        Adotamos medidas técnicas e administrativas de proteção, como criptografia em trânsito,
        controle de acesso por usuário autenticado, regras de isolamento de dados no banco e
        verificação de senhas vazadas no cadastro. Nenhum sistema é totalmente imune a incidentes;
        caso ocorra um incidente relevante, comunicaremos você e a autoridade competente.
      </p>
    </LegalSection>

    <LegalSection title="9. Seus direitos como titular">
      <p>A LGPD garante a você o direito de:</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>confirmar a existência de tratamento e acessar seus dados;</li>
        <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>solicitar anonimização, bloqueio ou eliminação de dados desnecessários;</li>
        <li>solicitar a portabilidade dos dados;</li>
        <li>revogar o consentimento e solicitar a exclusão da conta;</li>
        <li>ser informado sobre com quem seus dados foram compartilhados;</li>
        <li>opor-se a tratamentos que considere irregulares.</li>
      </ul>
      <p>
        Os pedidos podem ser enviados para{" "}
        <a href="mailto:privacidade@comafacil.com.br" className="text-primary underline">
          privacidade@comafacil.com.br
        </a>{" "}
        e serão respondidos nos prazos previstos em lei.
      </p>
    </LegalSection>

    <LegalSection title="10. Cookies e armazenamento local">
      <p>
        Utilizamos cookies e armazenamento local do navegador apenas para fins essenciais, como
        manter sua sessão ativa, guardar preferências de tema e preservar rascunhos de conteúdo
        dentro da plataforma.
      </p>
    </LegalSection>

    <LegalSection title="11. Alterações nesta Política">
      <p>
        Esta Política pode ser atualizada a qualquer momento. A data da última atualização aparece no
        topo desta página e alterações relevantes serão comunicadas a você.
      </p>
      <p>
        Consulte também nossos{" "}
        <Link to="/termos" className="text-primary underline">
          Termos de Uso
        </Link>
        .
      </p>
    </LegalSection>
  </LegalPage>
);

export default Privacidade;
