import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { Link } from "react-router-dom";

const Privacidade = () => (
  <LegalPage
    title="Política de Privacidade"
    updatedAt="23 de novembro de 2026"
    intro="Esta Política explica como o ComaFacil coleta, utiliza, armazena, compartilha e protege dados pessoais durante o uso da plataforma, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD) e demais normas aplicáveis."
  >
    <LegalSection title="1. Quem trata seus dados">
      <p>
        O ComaFacil é responsável pelas decisões sobre o tratamento dos dados pessoais realizados
        para operar a plataforma. Para dúvidas, solicitações ou exercício dos seus direitos de
        privacidade, entre em contato pelo endereço:
        {" "}
        <a href="mailto:privacidade@comafacil.com.br" className="text-primary underline">
          privacidade@comafacil.com.br
        </a>
        .
      </p>
    </LegalSection>

    <LegalSection title="2. Quais dados podemos tratar">
      <p>
        <strong>Dados de cadastro:</strong> nome, endereço de e-mail, data de nascimento e país.
      </p>
      <p>
        <strong>Dados de saúde e alimentação:</strong> peso, altura, índice de massa corporal
        calculado, nível de atividade física, objetivos, quantidade de refeições, restrições e
        preferências alimentares, alergias, intolerâncias e condições de saúde informadas pelo
        usuário. Essas informações podem ser dados pessoais sensíveis segundo a LGPD.
      </p>
      <p>
        <strong>Conteúdos enviados:</strong> textos sobre refeições e alimentos, mensagens enviadas
        ao assistente, fotos de pratos e informações incluídas em cardápios ou planos alimentares.
      </p>
      <p>
        <strong>Dados de uso:</strong> cardápios e receitas gerados ou salvos, listas de compras,
        registros de progresso, atividades realizadas e informações necessárias para aplicar os
        limites dos planos.
      </p>
      <p>
        <strong>Dados de assinatura e pagamento:</strong> plano contratado, situação da assinatura,
        identificadores de cobrança e identificadores técnicos de clientes e sessões no provedor de
        pagamento. Os dados completos do cartão são tratados pelo provedor de pagamento, e não são
        armazenados pelo ComaFacil.
      </p>
      <p>
        <strong>Dados do responsável pela contratação:</strong> quando um adulto contrata um plano
        para uma conta adolescente, podemos tratar nome, e-mail, declaração de maioridade e
        responsabilidade legal, vínculo do convite, status da solicitação e registros da contratação.
        O link de convite utiliza um token de uso único armazenado no banco de dados em formato
        criptográfico de hash.
      </p>
      <p>
        <strong>Dados técnicos e de funcionamento:</strong> informações estritamente necessárias
        para autenticação, segurança, funcionamento da sessão e diagnóstico de falhas, conforme
        disponibilizadas pelos serviços utilizados pela plataforma.
      </p>
    </LegalSection>

    <LegalSection title="3. Dados de saúde e bases legais">
      <p>
        Informações sobre saúde são dados pessoais sensíveis. O ComaFacil somente poderá tratá-las
        quando houver uma das hipóteses legais específicas previstas no artigo 11 da LGPD. A base
        legal aplicável dependerá da finalidade e das circunstâncias do tratamento.
      </p>
      <p>
        Quando a hipótese utilizada for o consentimento, ele deverá ser livre, informado, específico
        e destacado, para finalidades determinadas. O simples uso da plataforma ou a aceitação
        genérica destes documentos não será tratado como consentimento específico para dados
        sensíveis. O usuário poderá revogar o consentimento, observadas as consequências legais e
        operacionais da revogação.
      </p>
      <p>
        A recusa em fornecer informações de saúde ou a revogação de consentimento poderá impedir
        recursos que dependam dessas informações, sem impedir o acesso a funcionalidades que possam
        ser utilizadas sem elas.
      </p>
    </LegalSection>

    <LegalSection title="4. Crianças, adolescentes e idade mínima">
      <p>
        Conforme os Termos de Uso, o ComaFacil é destinado a pessoas com 12 anos completos ou mais.
        A plataforma não se destina a crianças com menos de 12 anos.
      </p>
      <p>
        Dados pessoais de adolescentes entre 12 e 17 anos serão tratados com atenção especial,
        observando o melhor interesse, a proteção da privacidade, a segurança e as demais garantias
        previstas na legislação aplicável.
      </p>
      <p>
        Antes de solicitar dados de saúde de um adolescente, a plataforma exige autorização específica
        de um responsável por um fluxo separado. O responsável deve acessar uma conta com 18 anos
        completos ou mais, e-mail confirmado e data de nascimento cadastrada, declarar seu vínculo
        legal e confirmar expressamente a autorização. O convite é individual, de uso único e expira
        em 24 horas. O registro guarda a conta adulta utilizada, o e-mail, o nome declarado, o vínculo,
        a versão do texto e a data da autorização.
      </p>
      <p>
        A verificação técnica da idade e do e-mail da conta adulta não comprova, por si só, a guarda
        ou a representação legal. O vínculo é declarado pelo adulto e não há conferência documental
        automática nesta etapa. A autorização pode ser revogada, e os dados de saúde associados serão
        apagados conforme o procedimento de revogação descrito nesta Política.
      </p>
      <p>
        A contratação de planos pagos por menores de 18 anos deverá ser realizada por um adulto que
        declare ser pai, mãe ou responsável legal, por meio de um convite individual com validade
        limitada e uso único. O adulto informa nome e e-mail e realiza o pagamento sem precisar criar
        uma conta ComaFacil.
      </p>
      <p>
        O fluxo registra a declaração e os dados informados pelo adulto, mas não realiza verificação
        documental automática do vínculo familiar ou da autoridade legal. Essa limitação deve ser
        considerada na avaliação do procedimento e poderá exigir medidas adicionais antes da
        disponibilização ampla da contratação.
      </p>
    </LegalSection>

    <LegalSection title="5. Para que utilizamos os dados">
      <ul className="list-disc pl-5 space-y-2">
        <li>criar, manter e proteger contas e autenticar usuários;</li>
        <li>gerar cardápios, receitas, listas de compras e análises solicitadas;</li>
        <li>considerar alergias, restrições e informações fornecidas para adaptar respostas e alertas;</li>
        <li>administrar planos, assinaturas, cobranças, convites de responsáveis e limites de utilização;</li>
        <li>salvar preferências e conteúdos solicitados pelo usuário;</li>
        <li>prestar suporte e enviar comunicações operacionais;</li>
        <li>prevenir fraude, abuso, acessos não autorizados e falhas de segurança;</li>
        <li>cumprir obrigações legais e exercer direitos em procedimentos administrativos ou judiciais;</li>
        <li>avaliar e melhorar o funcionamento do serviço, observadas as bases legais aplicáveis.</li>
      </ul>
    </LegalSection>

    <LegalSection title="6. Inteligência artificial e conteúdo enviado">
      <p>
        Para oferecer recursos de inteligência artificial, a plataforma encaminha os textos,
        instruções, informações de contexto e, quando necessário, imagens enviados pelo usuário ao
        serviço de inteligência artificial utilizado pelo ComaFacil.
      </p>
      <p>
        Atualmente, as funções de IA são encaminhadas pelo gateway de IA da Lovable, que utiliza
        modelos de provedores como Google Gemini. O modelo utilizado pode variar conforme a
        funcionalidade e a configuração técnica do serviço.
      </p>
      <p>
        Quando o usuário solicita uma análise de foto de prato, a imagem é enviada ao serviço de IA
        para identificação dos alimentos. Quando uma função utiliza o perfil alimentar ou de saúde,
        as informações relevantes desse perfil podem ser incluídas no contexto enviado para gerar a
        resposta.
      </p>
      <p>
        Esses fornecedores podem tratar as informações necessárias para executar a solicitação,
        conforme seus próprios termos e condições e os instrumentos aplicáveis ao serviço. O
        ComaFacil não deve enviar informações que não sejam necessárias à funcionalidade solicitada.
      </p>
    </LegalSection>

    <LegalSection title="7. Com quem compartilhamos">
      <p>
        Os dados poderão ser compartilhados, na medida necessária ao funcionamento da plataforma,
        com as seguintes categorias de prestadores de serviço:
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li>serviços de hospedagem, infraestrutura, banco de dados e autenticação;</li>
        <li>gateway e provedores de inteligência artificial, para processar solicitações de IA;</li>
        <li>provedor de pagamento, para processar e administrar assinaturas e identificar o adulto contratante;</li>
        <li>serviços de envio de e-mails operacionais e de suporte;</li>
        <li>autoridades públicas, quando houver obrigação legal, regulatória ou ordem válida.</li>
      </ul>
      <p>
        O ComaFacil não vende dados pessoais. O compartilhamento com prestadores de serviço deve
        limitar-se ao necessário para as finalidades descritas nesta Política e estar sujeito às
        salvaguardas aplicáveis.
      </p>
    </LegalSection>

    <LegalSection title="8. Transferência internacional de dados">
      <p>
        Alguns prestadores de serviço podem armazenar ou processar dados em outros países. Quando
        houver transferência internacional, ela deverá ocorrer por mecanismo permitido pela LGPD e
        pela regulamentação aplicável da Autoridade Nacional de Proteção de Dados, com as garantias
        exigidas para a proteção dos dados pessoais.
      </p>
    </LegalSection>

    <LegalSection title="9. Por quanto tempo guardamos os dados">
      <p>
        Os dados são mantidos pelo período necessário às finalidades informadas, enquanto a conta
        estiver ativa ou pelo tempo exigido para cumprir obrigações legais e regulatórias, resolver
        solicitações, prevenir fraudes e resguardar direitos.
      </p>
      <p>
        Quando não forem mais necessários, os dados serão eliminados ou anonimizados, ressalvadas as
        hipóteses legais que autorizem sua conservação. Prazos específicos podem variar conforme a
        categoria de dado e a obrigação aplicável.
      </p>
    </LegalSection>

    <LegalSection title="10. Segurança da informação">
      <p>
        O ComaFacil adota e busca aprimorar medidas técnicas e administrativas razoáveis e
        proporcionais aos riscos e à natureza dos dados tratados, incluindo controles de acesso,
        autenticação, regras de acesso ao banco de dados e medidas de proteção dos sistemas e das
        comunicações, conforme aplicável à infraestrutura utilizada.
      </p>
      <p>
        Nenhum sistema conectado à internet pode garantir segurança absoluta contra todos os
        incidentes, ataques ou falhas. Isso não elimina o dever de adotar as medidas de segurança
        exigidas pela legislação. Se ocorrer incidente de segurança que possa acarretar risco ou
        dano relevante, o ComaFacil adotará as providências e realizará as comunicações exigidas
        pela legislação aplicável.
      </p>
    </LegalSection>

    <LegalSection title="11. Seus direitos">
      <p>Nos termos da LGPD, você poderá solicitar, conforme aplicável:</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>confirmação da existência de tratamento e acesso aos dados;</li>
        <li>correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
        <li>portabilidade, observadas as regras da autoridade competente e os segredos comercial e industrial;</li>
        <li>informações sobre compartilhamento de dados;</li>
        <li>revogação do consentimento e eliminação dos dados tratados com essa base, quando cabível;</li>
        <li>oposição a tratamento realizado em desconformidade com a legislação;</li>
        <li>revisão de decisões tomadas unicamente com base em tratamento automatizado, nos termos da lei.</li>
      </ul>
      <p>
        Para exercer seus direitos, envie uma solicitação para
        {" "}
        <a href="mailto:privacidade@comafacil.com.br" className="text-primary underline">
          privacidade@comafacil.com.br
        </a>
        . Poderemos solicitar informações estritamente necessárias para confirmar a identidade do
        solicitante e proteger os dados contra acesso indevido. As solicitações serão tratadas nos
        prazos e condições previstos na legislação.
      </p>
    </LegalSection>

    <LegalSection title="12. Cookies e armazenamento no dispositivo">
      <p>
        A plataforma utiliza recursos do navegador, como armazenamento local e armazenamento de
        sessão, para manter preferências, funcionamento da sessão, etapas temporárias do cadastro e
        determinadas funcionalidades, como a preservação de conteúdos salvos.
      </p>
      <p>
        Esses recursos podem incluir, por exemplo, preferências de aparência e dados temporários
        necessários ao funcionamento de etapas do serviço. O usuário pode gerenciar os dados
        armazenados pelo navegador, mas a remoção de determinados itens pode afetar o funcionamento
        ou a disponibilidade de recursos.
      </p>
      <p>
        Esta Política não significa que todo armazenamento local seja um cookie. Tecnologias e
        eventuais cookies de terceiros serão descritos de forma específica caso sejam utilizados.
      </p>
    </LegalSection>

    <LegalSection title="13. Alterações nesta Política">
      <p>
        Esta Política poderá ser atualizada para refletir mudanças legais, técnicas ou nos serviços.
        A data da última atualização aparece no topo desta página. Alterações relevantes serão
        comunicadas pelos meios disponíveis na plataforma, quando aplicável.
      </p>
      <p>
        Consulte também nossos
        {" "}
        <Link to="/termos" className="text-primary underline">
          Termos de Uso
        </Link>
        .
      </p>
    </LegalSection>
  </LegalPage>
);

export default Privacidade;
