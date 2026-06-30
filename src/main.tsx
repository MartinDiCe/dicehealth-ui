import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  ArrowRight,
  Bot,
  CalendarCheck,
  ClipboardCheck,
  ExternalLink,
  FileText,
  HeartPulse,
  LineChart,
  MessageCircle,
  Microscope,
  Pill,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
} from 'lucide-react';
import './styles.css';

type Message = { from: 'user' | 'bot'; text: string };

const modules = [
  ['Agenda clínica', 'Agenda por profesional, consultorio, especialidad, equipo, sede, confirmación, reprogramación y lista de espera.', CalendarCheck],
  ['Pacientes', 'Ficha completa con datos, tutor/familia, cobertura, contacto, alertas, documentación y permisos.', UsersRound],
  ['Historia clínica', 'Evoluciones, diagnósticos, indicaciones, estudios, adjuntos, imágenes, archivos y auditoría.', FileText],
  ['Tratamientos', 'Planes, sesiones, controles, seguimiento, resultados y alta.', HeartPulse],
  ['Medicamentos e insumos', 'Vacunas, medicamentos, dosis, vía, frecuencia, lotes, vencimientos y vínculo con stock clínico/warehouse.', Pill],
  ['Expediente clínico', 'Historia, estudios, consentimientos, recetas, presupuestos, informes, documentos y derivaciones.', ClipboardCheck],
  ['Scoring clínico', 'Motor configurable por riesgo, urgencia, ausentismo, prioridad y continuidad.', Activity],
  ['Dashboard clínico', 'Pacientes atendidos, tratamientos activos, ausentismo, ocupación, profesionales y consultorios.', LineChart],
  ['Copiloto clínico', 'Consulta pacientes pendientes, prioridad, tratamientos, disponibilidad y operación asistencial.', Bot],
] as const;

const verticals = [
  { title: 'Clínicas y centros médicos', copy: 'Pacientes humanos, especialidades, coberturas, historia clínica, documentos y agenda por profesional.' },
  { title: 'Consultorios y profesionales', copy: 'Agenda, ficha clínica, seguimiento, derivaciones, recordatorios y comunicación con pacientes.' },
  { title: 'Veterinarias y hospitales veterinarios', copy: 'Tutores, pacientes animales, especies, razas, equipos, consultorios, internación y scoring de asistencia.' },
  { title: 'Diagnóstico y rehabilitación', copy: 'Equipamiento médico, estudios, sesiones, resultados, órdenes y seguimiento por tratamiento.' },
];

const flows = [
  ['Paciente', 'La operación nace en una ficha clínica completa, humana o veterinaria.'],
  ['Turno', 'Reserva por profesional, consultorio, equipo, sede y disponibilidad.'],
  ['Confirmación', 'Links públicos, WhatsApp/email, reprogramación y cancelación trazable.'],
  ['Atención', 'Consulta, evolución, diagnóstico, indicaciones y documentación.'],
  ['Tratamiento', 'Plan, sesiones, controles, seguimiento, resultados y alta.'],
  ['Dashboard', 'Ocupación, ausentismo, pacientes pendientes y alertas clínicas.'],
  ['Copiloto', 'Preguntas contextuales sobre prioridad, continuidad y disponibilidad.'],
];

const kpis = [
  ['124', 'pacientes activos'],
  ['38', 'tratamientos en curso'],
  ['91%', 'ocupación clínica'],
  ['17', 'alertas de seguimiento'],
];

const coreCapabilities = ['Usuarios', 'Roles', 'Permisos', 'Multiempresa', 'Agenda', 'Expedientes', 'Documentos', 'Notificaciones', 'Automatizaciones', 'Dashboard', 'Marketing', 'Warehouse clínico', 'Copiloto IA'];

const demoAlerts = [
  ['09:30', 'Dra. Aguirre · Control postquirúrgico · Lola', 'Confirmado'],
  ['10:30', 'Ecógrafo Doppler · Simba', 'Equipo'],
  ['11:30', 'Dr. Duarte · Cardiología · Milo', 'Prioridad'],
  ['12:30', 'Od. Romano · Ortodoncia · Martina', 'Control'],
];

const publicLinks = [
  {
    title: 'Confirmar turno clínico',
    tag: 'CONFIRMACIÓN',
    copy: 'Pantalla pública para confirmar asistencia, validar datos del responsable y dejar trazabilidad.',
    detail: 'Lola · Control postquirúrgico · Dra. Aguirre · 09:30',
    href: 'https://backoffice.diceprojects.com/public/dicehealth/appointments/dicehealth-demo-confirmar-lola',
  },
  {
    title: 'Reconfirmar estudio',
    tag: 'EQUIPO MÉDICO',
    copy: 'Vista para reconfirmar un estudio con preparación previa, sede, equipo asignado e instrucciones.',
    detail: 'Simba · Ecógrafo Doppler · Hospital Norte · 10:30',
    href: 'https://backoffice.diceprojects.com/public/dicehealth/studies/dicehealth-demo-ecografia-simba',
  },
  {
    title: 'Indicaciones y vacunas',
    tag: 'SEGUIMIENTO',
    copy: 'Link de seguimiento clínico con recomendaciones, medicación indicada y próximas vacunas.',
    detail: 'Milo · Cardiología · vacunas y medicación pendiente',
    href: 'https://backoffice.diceprojects.com/public/dicehealth/follow-up/dicehealth-demo-milo-cardio',
  },
] as const;

const copilotKnowledge = [
  {
    intent: ['paciente', 'ficha', 'tutor', 'animal', 'hijo'],
    answer: 'DiceHealth separa paciente de responsable. En clínica humana puede ser padre/madre/tutor e hijos; en veterinaria es tutor y animales. El email vive en el tutor/responsable, y cada paciente se vincula por relación autorizada.',
  },
  {
    intent: ['agenda', 'turno', 'disponibilidad', 'consultorio', 'equipo'],
    answer: 'La agenda clínica trabaja con servicios, profesionales, consultorios y equipamiento. Un turno puede requerir profesional de salud, equipo médico o ambos. Los links públicos permiten confirmar, reconfirmar o cancelar sin exponer IDs internos.',
  },
  {
    intent: ['historia', 'clinica', 'evolucion', 'documento', 'auditoria'],
    answer: 'La historia clínica registra evoluciones, estudios, diagnósticos, indicaciones y adjuntos. Todo debe quedar auditado, con permisos por perfil y sin mezclar datos clínicos sensibles en vistas comerciales.',
  },
  {
    intent: ['medicamento', 'medicacion', 'vacuna', 'insumo', 'stock', 'warehouse'],
    answer: 'DiceHealth puede administrar medicamentos, vacunas e insumos clínicos con dosis, vía, frecuencia, lotes, vencimientos y SKU de warehouse. En veterinaria esto permite ver vacunas faltantes, medicación indicada y consumo de stock desde la historia clínica.',
  },
  {
    intent: ['scoring', 'riesgo', 'ausentismo', 'prioridad'],
    answer: 'El scoring puede priorizar por riesgo clínico, urgencia, continuidad de tratamiento o ausentismo. En veterinaria conviene medir el comportamiento del tutor; en clínica humana puede medir responsable/paciente según caso.',
  },
  {
    intent: ['roi', 'beneficio', 'ausentismo', 'productividad'],
    answer: 'El ROI aparece por reducción de ausentismo, mejor ocupación de profesionales y equipos, menos carga administrativa, mejor continuidad de tratamientos y trazabilidad clínica más confiable.',
  },
];

function askCopilot(prompt: string) {
  const normalized = prompt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return copilotKnowledge.find((item) => item.intent.some((key) => normalized.includes(key)))?.answer
    ?? 'Lo miraría como operación clínica completa: paciente, responsable, agenda, profesional/equipo, historia clínica, tratamiento, comunicación y métrica. Si falta una pieza, el proceso queda ciego.';
}

function Copilot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: 'Soy el copiloto de DiceHealth. Preguntame por pacientes, tutores, agenda clínica, historia, scoring o veterinaria.' },
  ]);
  const prompts = ['¿Cómo manejo tutores y pacientes?', '¿Qué mide el scoring?', '¿Cómo funciona la agenda clínica?'];
  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((current) => [...current, { from: 'user', text }, { from: 'bot', text: askCopilot(text) }]);
    setInput('');
    setOpen(true);
  };
  return (
    <>
      <button className="copilot-pill" onClick={() => setOpen((value) => !value)}><Sparkles size={18} /> Copiloto</button>
      {open && (
        <aside className="copilot-panel">
          <header><Bot size={20} /><strong>Copiloto DiceHealth</strong><button onClick={() => setOpen(false)}>x</button></header>
          <div className="prompt-row">{prompts.map((prompt) => <button key={prompt} onClick={() => send(prompt)}>{prompt}</button>)}</div>
          <div className="chat-log">{messages.slice(-6).map((message, index) => <p key={index} className={message.from}>{message.text}</p>)}</div>
          <form onSubmit={(event) => { event.preventDefault(); send(input); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Preguntar por flujo clínico..." /><button><Send size={17} /></button></form>
        </aside>
      )}
    </>
  );
}

function App() {
  const roi = useMemo(() => ({
    noShow: '18%',
    occupancy: '26%',
    admin: '14 hs',
  }), []);
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#inicio"><span className="brand-mark" /><span><strong>DiceHealth</strong><small>Gestión clínica</small></span></a>
        <div><a href="#modulos">Módulos</a><a href="#core">Core</a><a href="#dashboard">Dashboard</a><a href="#links">Links</a><a href="#demo">Demo</a></div>
      </nav>
      <section id="inicio" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">PLATAFORMA CLÍNICA · DICEPROJECTS CORE</p>
          <h1>La Plataforma de Gestión Clínica para instituciones de salud.</h1>
          <p>Centralizá pacientes, agenda, historia clínica, tratamientos, expedientes y seguimiento clínico desde una única plataforma con IA, automatizaciones e integración completa.</p>
          <div className="actions"><a className="button primary" href="#demo">Ver demo <ArrowRight size={18} /></a><a className="button secondary" href="#modulos">Ver módulos</a></div>
        </div>
        <div className="clinical-board">
          <div className="board-head"><Stethoscope /><span>Agenda clínica</span><b>Hoy</b></div>
          {demoAlerts.map(([time, item, status]) => <div className="slot" key={item}><span>{time}</span><strong>{item}</strong><em>{status}</em></div>)}
        </div>
      </section>
      <section className="kpis">{kpis.map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</section>
      <section id="modulos" className="section">
        <div className="section-title"><p className="eyebrow">GESTIÓN CLÍNICA COMPLETA</p><h2>No es un turnero ni una historia clínica aislada.</h2><p>DiceHealth administra el ciclo completo de atención: paciente, turno, confirmación, atención, historia clínica, tratamiento, seguimiento, dashboard y copiloto clínico.</p></div>
        <div className="cards">{modules.map(([title, copy, Icon]) => <article key={title}><Icon /><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>
      <section id="verticales" className="section split">
        <div><p className="eyebrow">SEGMENTACIÓN REAL</p><h2>El usuario elige si atiende humanos, animales o ambos con reglas claras.</h2><p>Los datos base humanos y veterinarios no se mezclan. La plataforma comparte Core, pero cada vertical carga pacientes, responsables, agenda, estudios y documentos según su operación.</p></div>
        <div className="verticals">{verticals.map((item) => <article key={item.title}><ShieldCheck /><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div>
      </section>
      <section id="core" className="section core-panel">
        <div className="section-title"><p className="eyebrow">CONSTRUIDO SOBRE DICEPROJECTS CORE</p><h2>Un Core común para operar instituciones, permisos, datos e inteligencia.</h2><p>DiceHealth hereda las capacidades transversales de la plataforma y las aplica al modelo clínico/asistencial.</p></div>
        <div className="core-list">{coreCapabilities.map((item) => <span key={item}><ShieldCheck size={16} /> {item}</span>)}</div>
      </section>
      <section id="dashboard" className="section dashboard">
        <div><p className="eyebrow">DASHBOARD DE SALUD</p><h2>Indicadores para dirigir la operación clínica.</h2><p>Ausentismo, ocupación, tratamientos activos, pacientes en seguimiento, disponibilidad profesional y uso de equipamiento.</p></div>
        <div className="metrics">
          <article><LineChart /><strong>-{roi.noShow}</strong><span>inasistencias con confirmación</span></article>
          <article><CalendarCheck /><strong>+{roi.occupancy}</strong><span>ocupación de agenda</span></article>
          <article><ClipboardCheck /><strong>{roi.admin}</strong><span>ahorro administrativo semanal</span></article>
          <article><HeartPulse /><strong>38</strong><span>tratamientos activos</span></article>
        </div>
      </section>
      <section className="section flows">
        <div className="section-title"><p className="eyebrow">FLUJOS</p><h2>De la reserva al seguimiento clínico.</h2></div>
        <div>{flows.map(([title, copy], index) => <article key={title}><b>{index + 1}</b><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>
      <section className="section kb-strip">
        <article>
          <p className="eyebrow">KB PARA COPILOTO</p>
          <h2>Experto en operación de salud.</h2>
          <p>La base del copiloto entiende salud humana, veterinaria, tutores, pacientes, historia clínica, agenda, equipos, scoring y permisos.</p>
        </article>
        <div className="kb-list">
          <span><UsersRound size={18} /> Pacientes, tutores, animales e hijos.</span>
          <span><CalendarCheck size={18} /> Turnos por profesional, consultorio y equipo.</span>
          <span><Microscope size={18} /> Tratamientos, estudios y documentación clínica.</span>
          <span><Pill size={18} /> Vacunas, medicación e insumos con stock.</span>
          <span><MessageCircle size={18} /> Confirmaciones, reconfirmaciones y seguimiento.</span>
        </div>
      </section>
      <section id="links" className="section public-links">
        <div className="section-title">
          <p className="eyebrow">LINKS PÚBLICOS DEMO</p>
          <h2>Confirmaciones clínicas sin exponer el backoffice.</h2>
          <p>Estos accesos representan lo que recibe un tutor, paciente o responsable para confirmar turno, reconfirmar estudios y revisar indicaciones de seguimiento.</p>
        </div>
        <div className="link-grid">
          {publicLinks.map((item) => (
            <a className="public-card" href={item.href} target="_blank" rel="noreferrer" key={item.title}>
              <span className="link-top"><small>{item.tag}</small><ExternalLink size={18} /></span>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
              <em>{item.detail}</em>
            </a>
          ))}
        </div>
      </section>
      <section id="demo" className="section lead">
        <div><p className="eyebrow">DATOS DEMO</p><h2>Una institución funcionando, nunca una pantalla vacía.</h2><p>Profesionales médicos, odontólogos, psicólogos y veterinarios; pacientes adultos, niños y mascotas; tratamientos de ortodoncia, kinesiología, vacunación, psicología y rehabilitación.</p></div>
        <div className="demo-panel">
          <h3>Próximos turnos y alertas</h3>
          {demoAlerts.map(([time, item, status]) => <p key={item}><b>{time}</b><span>{item}</span><em>{status}</em></p>)}
        </div>
        <form><input placeholder="Nombre" /><input placeholder="Email" /><textarea placeholder="Contanos si es clínica, consultorio, veterinaria o centro de diagnóstico" /><button className="button primary" type="button">Solicitar demo</button></form>
      </section>
      <footer>DiceHealth no es un sistema de turnos. Es una Plataforma de Gestión Clínica sobre DiceProjects Core.</footer>
      <Copilot />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
