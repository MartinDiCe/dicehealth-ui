import React, { useEffect, useMemo, useState } from 'react';
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
import { askPublicBot, config, type DemoAppointmentSlot, fetchDemoAppointmentSlots, publicUrl, requestDemoAppointment, track } from './runtime';

type Message = { from: 'user' | 'bot'; text: string };

const modules = [
  ['Agenda', 'Turnos, equipos y confirmaciones.', CalendarCheck],
  ['Pacientes', 'Ficha clínica y responsables.', UsersRound],
  ['Historia', 'Evoluciones, estudios y adjuntos.', FileText],
  ['Tratamientos', 'Planes, controles y seguimiento.', HeartPulse],
  ['Insumos', 'Vacunas, medicación y stock.', Pill],
  ['Expedientes', 'Documentos clínicos trazables.', ClipboardCheck],
  ['Scoring', 'Riesgo, prioridad y ausentismo.', Activity],
  ['Dashboard', 'Ocupación y alertas clínicas.', LineChart],
  ['Copiloto', 'Preguntas sobre la operación.', Bot],
] as const;

const verticals = [
  { title: 'Clínicas', copy: 'Especialidades, historia y agenda.' },
  { title: 'Consultorios', copy: 'Ficha, turnos y seguimiento.' },
  { title: 'Veterinarias', copy: 'Tutores, animales y vacunas.' },
  { title: 'Diagnóstico', copy: 'Equipos, estudios y resultados.' },
];

const flows = [
  ['Paciente', 'Ficha única.'],
  ['Turno', 'Agenda clínica.'],
  ['Confirmación', 'Links públicos.'],
  ['Atención', 'Evolución y adjuntos.'],
  ['Tratamiento', 'Seguimiento.'],
  ['Dashboard', 'Indicadores.'],
  ['Copiloto', 'Consulta operativa.'],
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
    copy: 'Asistencia, datos y trazabilidad.',
    detail: 'Lola · Control postquirúrgico · Dra. Aguirre · 09:30',
    href: publicUrl(config.confirmPath),
  },
  {
    title: 'Reconfirmar estudio',
    tag: 'EQUIPO MÉDICO',
    copy: 'Preparación, sede y equipo.',
    detail: 'Simba · Ecógrafo Doppler · Hospital Norte · 10:30',
    href: publicUrl(config.studyPath),
  },
  {
    title: 'Indicaciones y vacunas',
    tag: 'SEGUIMIENTO',
    copy: 'Recomendaciones y próximos pasos.',
    detail: 'Milo · Cardiología · vacunas y medicación pendiente',
    href: publicUrl(config.followUpPath),
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
    { from: 'bot', text: 'Preguntame por pacientes, agenda, historia o scoring.' },
  ]);
  const prompts = ['¿Cómo manejo tutores y pacientes?', '¿Qué mide el scoring?', '¿Cómo funciona la agenda clínica?'];
  const send = (text: string) => {
    if (!text.trim()) return;
    track('BOT_QUESTION', { actionCode: 'dicehealth_public_copilot_question', actionLabel: text.slice(0, 120), category: 'COPILOT' });
    setMessages((current) => [...current, { from: 'user', text }, { from: 'bot', text: askCopilot(text) }]);
    void askPublicBot(text).then((remoteAnswer) => {
      if (remoteAnswer) {
        setMessages((current) => [...current.slice(0, -1), { from: 'bot', text: remoteAnswer }]);
      }
    });
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

function AppointmentDemo() {
  const [careMode, setCareMode] = useState<'veterinary' | 'human'>('veterinary');
  const [slots, setSlots] = useState<DemoAppointmentSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    tutorName: '',
    tutorEmail: '',
    tutorPhone: '',
    animalName: '',
    animalSpecies: 'Perro',
    reason: 'Consulta clínica',
  });
  const modeCopy = careMode === 'veterinary'
    ? {
        eyebrow: 'Demo veterinaria',
        responsable: 'Tutor responsable',
        patient: 'Animal / paciente',
        species: ['Perro', 'Gato', 'Conejo', 'Ave', 'Exótico'],
        note: 'El tutor queda como contacto y el animal viaja como paciente clínico.',
      }
    : {
        eyebrow: 'Demo salud humana',
        responsable: 'Responsable / paciente',
        patient: 'Paciente',
        species: ['Adulto', 'Menor', 'Control', 'Primera vez', 'Estudio'],
        note: 'El responsable queda como contacto y el paciente viaja en la reserva clínica.',
      };

  useEffect(() => {
    setForm((current) => ({
      ...current,
      animalSpecies: careMode === 'veterinary' ? 'Perro' : 'Adulto',
      reason: careMode === 'veterinary' ? 'Consulta clínica' : 'Consulta médica',
    }));
  }, [careMode]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchDemoAppointmentSlots()
      .then((next) => {
        if (!alive) return;
        setSlots(next);
        setSelectedSlotId(next[0]?.id ?? '');
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);
  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSlot || !form.tutorName.trim() || !form.tutorEmail.trim() || !form.animalName.trim()) {
      setStatus('Completá tutor, email, paciente y turno.');
      return;
    }
    setSubmitting(true);
    const result = await requestDemoAppointment({
      slot: selectedSlot,
      ...form,
      animalSpecies: careMode === 'veterinary' ? form.animalSpecies : `Humana · ${form.animalSpecies}`,
      reason: `${careMode === 'veterinary' ? 'Veterinaria' : 'Salud humana'} · ${form.reason}`,
    });
    setStatus(result.message);
    setSubmitting(false);
  };

  return (
    <section id="demo" className="section lead">
      <div className="lead-sidebar">
        <p className="eyebrow">{modeCopy.eyebrow}</p>
        <h2>Reservar un turno.</h2>
        <p>{modeCopy.note}</p>
        <div className="mode-switch" aria-label="Tipo de entidad">
          <button className={careMode === 'veterinary' ? 'active' : ''} type="button" onClick={() => setCareMode('veterinary')}>Animal</button>
          <button className={careMode === 'human' ? 'active' : ''} type="button" onClick={() => setCareMode('human')}>Humana</button>
        </div>
        <ol className="booking-steps">
          <li><b>1</b><span>Elegí un horario futuro.</span></li>
          <li><b>2</b><span>Cargá responsable y paciente.</span></li>
          <li><b>3</b><span>La reserva llega a Agenda.</span></li>
        </ol>
      </div>
      <div className="demo-panel appointment-panel">
        <header className="panel-head">
          <h3>Disponibilidad</h3>
          <span>{slots.length || '-'} turnos</span>
        </header>
        {loading && <p className="plain-row">Cargando agenda...</p>}
        <div className="slot-list">
          {!loading && slots.map((slot) => (
            <button
              className={slot.id === selectedSlotId ? 'appointment-slot active' : 'appointment-slot'}
              key={slot.id}
              type="button"
              onClick={() => setSelectedSlotId(slot.id)}
            >
              <b>{formatSlotDay(slot.startsAt)}<small>{formatSlotHour(slot.startsAt)}</small></b>
              <span>{slot.serviceName}<small>{slot.resourceName}</small></span>
              <em>{slot.source === 'api' ? 'SALUD' : 'Demo'}</em>
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={submit}>
        {selectedSlot && (
          <div className="selected-slot">
            <span>Turno seleccionado</span>
            <strong>{formatSlotDate(selectedSlot.startsAt)}</strong>
            <small>{selectedSlot.serviceName} · {selectedSlot.resourceName}</small>
          </div>
        )}
        <input value={form.tutorName} onChange={update('tutorName')} placeholder={modeCopy.responsable} autoComplete="name" />
        <input value={form.tutorEmail} onChange={update('tutorEmail')} placeholder="Email de contacto" type="email" autoComplete="email" />
        <input value={form.tutorPhone} onChange={update('tutorPhone')} placeholder="Teléfono" autoComplete="tel" />
        <div className="form-grid">
          <input value={form.animalName} onChange={update('animalName')} placeholder={modeCopy.patient} />
          <select value={form.animalSpecies} onChange={update('animalSpecies')} aria-label="Especie">
            {modeCopy.species.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <textarea value={form.reason} onChange={update('reason')} placeholder="Motivo de consulta" />
        <button className="button primary" disabled={submitting || loading} type="submit">{submitting ? 'Reservando...' : 'Reservar turno'}</button>
        {status && <p className="form-status">{status}</p>}
      </form>
    </section>
  );
}

function formatSlotDay(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

function formatSlotHour(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatSlotDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function App() {
  const roi = useMemo(() => ({
    noShow: '18%',
    occupancy: '26%',
    admin: '14 hs',
  }), []);
  useEffect(() => {
    track('VIEW', { actionCode: 'dicehealth_page_home', actionLabel: 'DiceHealth landing', category: 'NAVIGATION' });
  }, []);
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#inicio"><span className="brand-mark" /><span><strong>DiceHealth</strong><small>Gestión clínica</small></span></a>
        <div><a data-mkt="dicehealth_nav_modules" href="#modulos">Módulos</a><a data-mkt="dicehealth_nav_core" href="#core">Core</a><a data-mkt="dicehealth_nav_dashboard" href="#dashboard">Dashboard</a><a data-mkt="dicehealth_nav_links" href="#links">Links</a><a data-mkt="dicehealth_nav_demo" href="#demo">Demo</a></div>
      </nav>
      <section id="inicio" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">DiceProjects Core · Salud</p>
          <h1>Gestión clínica conectada.</h1>
          <p>Pacientes, agenda, historia, tratamientos y seguimiento en una sola operación.</p>
          <div className="hero-tags"><span>Humana</span><span>Veterinaria</span><span>Multi sede</span><span>IA clínica</span></div>
          <div className="actions"><a className="button primary" href="#demo" onClick={() => track('CLICK', { actionCode: 'dicehealth_cta_demo', actionLabel: 'Ver demo', category: 'CTA' })}>Ver demo <ArrowRight size={18} /></a><a className="button secondary" href="#modulos" onClick={() => track('CLICK', { actionCode: 'dicehealth_cta_modules', actionLabel: 'Ver módulos', category: 'CTA' })}>Módulos</a></div>
        </div>
        <div className="clinical-board">
          <div className="board-head"><Stethoscope /><span>Agenda clínica</span><b>Hoy</b></div>
          {demoAlerts.map(([time, item, status]) => <div className="slot" key={item}><span>{time}</span><strong>{item}</strong><em>{status}</em></div>)}
        </div>
      </section>
      <section className="kpis">{kpis.map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</section>
      <section id="modulos" className="section">
        <div className="section-title compact"><p className="eyebrow">Módulos</p><h2>Todo el circuito clínico.</h2></div>
        <div className="cards">{modules.map(([title, copy, Icon]) => <article key={title}><Icon /><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>
      <section id="verticales" className="section split">
        <div><p className="eyebrow">Verticales</p><h2>Una base. Distintos modelos de atención.</h2></div>
        <div className="verticals">{verticals.map((item) => <article key={item.title}><ShieldCheck /><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div>
      </section>
      <section id="core" className="section core-panel">
        <div className="section-title compact"><p className="eyebrow">Core</p><h2>La capa operativa de DiceProjects.</h2></div>
        <div className="core-list">{coreCapabilities.map((item) => <span key={item}><ShieldCheck size={16} /> {item}</span>)}</div>
      </section>
      <section id="dashboard" className="section dashboard">
        <div><p className="eyebrow">Dashboard</p><h2>La operación en vivo.</h2></div>
        <div className="metrics">
          <article><LineChart /><strong>-{roi.noShow}</strong><span>inasistencias con confirmación</span></article>
          <article><CalendarCheck /><strong>+{roi.occupancy}</strong><span>ocupación de agenda</span></article>
          <article><ClipboardCheck /><strong>{roi.admin}</strong><span>ahorro administrativo semanal</span></article>
          <article><HeartPulse /><strong>38</strong><span>tratamientos activos</span></article>
        </div>
      </section>
      <section className="section flows">
        <div className="section-title compact"><p className="eyebrow">Flujo</p><h2>Del turno al seguimiento.</h2></div>
        <div>{flows.map(([title, copy], index) => <article key={title}><b>{index + 1}</b><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>
      <section className="section kb-strip">
        <article>
          <p className="eyebrow">Copiloto</p>
          <h2>IA con contexto clínico.</h2>
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
          <p className="eyebrow">Links públicos</p>
          <h2>Confirmaciones sin backoffice.</h2>
        </div>
        <div className="link-grid">
          {publicLinks.map((item) => (
            <a className="public-card" href={item.href} target="_blank" rel="noreferrer" key={item.title} onClick={() => track(item.tag === 'EQUIPO MÉDICO' ? 'CLICK' : 'APPOINTMENT_VIEW', { actionCode: `dicehealth_public_link_${item.tag.toLowerCase().replace(/\s+/g, '_')}`, actionLabel: item.title, category: 'PUBLIC_LINK', entityType: item.tag === 'EQUIPO MÉDICO' ? 'SERVICE' : 'APPOINTMENT', metadata: { href: item.href, detail: item.detail } })}>
              <span className="link-top"><small>{item.tag}</small><ExternalLink size={18} /></span>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
              <em>{item.detail}</em>
            </a>
          ))}
        </div>
      </section>
      <AppointmentDemo />
      <footer>DiceHealth · Plataforma clínica sobre DiceProjects Core.</footer>
      <Copilot />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
