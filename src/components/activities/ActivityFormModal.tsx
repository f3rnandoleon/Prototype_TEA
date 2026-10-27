'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  BookOpen,
  Layers,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PictogramPickerModal } from './PictogramPickerModal';
import {
  IActivity,
  ActivityType,
  ActivityDifficulty,
  IAssociationPair,
  ISelectionQuestion,
  ISelectionOption,
  ISequenceStep,
  IActivityConfig,
} from '@/types';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialActivity?: IActivity | null;
}

const COMMON_SKILLS = [
  'Atención y Reconocimiento Visual',
  'Identificación Emocional',
  'Secuenciación Temporal y Autonomía',
  'Lenguaje y Vocabulario',
  'Categorización y Clasificación',
  'Habilidades Sociales',
];

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialActivity,
}) => {
  const isEditing = Boolean(initialActivity);

  // Campos principales
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillType, setSkillType] = useState('Atención y Reconocimiento Visual');
  const [activityType, setActivityType] = useState<ActivityType>('association');
  const [difficulty, setDifficulty] = useState<ActivityDifficulty>('facil');
  const [instructions, setInstructions] = useState('');

  // Estados de configuración por tipo
  const [pairs, setPairs] = useState<IAssociationPair[]>([]);
  const [questions, setQuestions] = useState<ISelectionQuestion[]>([]);
  const [sequence, setSequence] = useState<ISequenceStep[]>([]);

  // Estados para selector de pictogramas
  const [pickerTarget, setPickerTarget] = useState<{
    type: 'pair-left' | 'pair-right' | 'question-prompt' | 'question-option' | 'sequence-step';
    index: number;
    subIndex?: number;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicialización al abrir o cambiar initialActivity
  useEffect(() => {
    if (!isOpen) return;

    if (initialActivity) {
      setTitle(initialActivity.title || '');
      setDescription(initialActivity.description || '');
      setSkillType(initialActivity.skillType || 'Atención y Reconocimiento Visual');
      setActivityType(initialActivity.activityType || 'association');
      setDifficulty(initialActivity.difficulty || 'facil');
      setInstructions(initialActivity.instructions || '');

      const cfg = initialActivity.config || {};
      if (initialActivity.activityType === 'association') {
        setPairs(
          cfg.pairs && cfg.pairs.length > 0
            ? JSON.parse(JSON.stringify(cfg.pairs))
            : getDefaultPairs()
        );
      } else if (initialActivity.activityType === 'selection') {
        setQuestions(
          cfg.questions && cfg.questions.length > 0
            ? JSON.parse(JSON.stringify(cfg.questions))
            : getDefaultQuestions()
        );
      } else if (initialActivity.activityType === 'sequence') {
        setSequence(
          cfg.sequence && cfg.sequence.length > 0
            ? JSON.parse(JSON.stringify(cfg.sequence))
            : getDefaultSequence()
        );
      }
    } else {
      // Nueva actividad
      setTitle('');
      setDescription('');
      setSkillType('Atención y Reconocimiento Visual');
      setActivityType('association');
      setDifficulty('facil');
      setInstructions('Toca con calma cada elemento para completar la actividad.');
      setPairs(getDefaultPairs());
      setQuestions(getDefaultQuestions());
      setSequence(getDefaultSequence());
    }

    setErrorMessage(null);
  }, [isOpen, initialActivity]);

  function getDefaultPairs(): IAssociationPair[] {
    return [
      {
        id: 'p1',
        leftText: 'Manzana',
        leftImage: 'https://api.arasaac.org/api/pictograms/2388?download=false',
        rightText: 'Fruta',
        rightImage: 'https://api.arasaac.org/api/pictograms/2388?download=false',
      },
      {
        id: 'p2',
        leftText: 'Vaso de Leche',
        leftImage: 'https://api.arasaac.org/api/pictograms/2422?download=false',
        rightText: 'Bebida',
        rightImage: 'https://api.arasaac.org/api/pictograms/2422?download=false',
      },
    ];
  }

  function getDefaultQuestions(): ISelectionQuestion[] {
    return [
      {
        id: 'q1',
        promptText: '¿Cuál de estos objetos se usa para dibujar?',
        promptImage: 'https://api.arasaac.org/api/pictograms/2408?download=false',
        options: [
          {
            id: 'o1',
            text: 'Lápiz de colores',
            imageUrl: 'https://api.arasaac.org/api/pictograms/2408?download=false',
            isCorrect: true,
          },
          {
            id: 'o2',
            text: 'Cuchara',
            imageUrl: 'https://api.arasaac.org/api/pictograms/2422?download=false',
            isCorrect: false,
          },
        ],
      },
    ];
  }

  function getDefaultSequence(): ISequenceStep[] {
    return [
      {
        id: 's1',
        order: 1,
        text: '1. Mojar las manos con agua',
        imageUrl: 'https://api.arasaac.org/api/pictograms/2438?download=false',
      },
      {
        id: 's2',
        order: 2,
        text: '2. Enjabonar y frotar bien',
        imageUrl: 'https://api.arasaac.org/api/pictograms/2449?download=false',
      },
      {
        id: 's3',
        order: 3,
        text: '3. Enjuagar y secar con toalla',
        imageUrl: 'https://api.arasaac.org/api/pictograms/2453?download=false',
      },
    ];
  }

  if (!isOpen) return null;

  // Manejo de pictogramas seleccionados
  const handlePictogramSelect = (imageUrl: string, label?: string) => {
    if (!pickerTarget) return;

    if (pickerTarget.type === 'pair-left') {
      const updated = [...pairs];
      updated[pickerTarget.index].leftImage = imageUrl;
      if (label && !updated[pickerTarget.index].leftText) {
        updated[pickerTarget.index].leftText = label;
      }
      setPairs(updated);
    } else if (pickerTarget.type === 'pair-right') {
      const updated = [...pairs];
      updated[pickerTarget.index].rightImage = imageUrl;
      if (label && !updated[pickerTarget.index].rightText) {
        updated[pickerTarget.index].rightText = label;
      }
      setPairs(updated);
    } else if (pickerTarget.type === 'question-prompt') {
      const updated = [...questions];
      updated[pickerTarget.index].promptImage = imageUrl;
      setQuestions(updated);
    } else if (pickerTarget.type === 'question-option') {
      const updated = [...questions];
      const optIdx = pickerTarget.subIndex ?? 0;
      updated[pickerTarget.index].options[optIdx].imageUrl = imageUrl;
      if (label && !updated[pickerTarget.index].options[optIdx].text) {
        updated[pickerTarget.index].options[optIdx].text = label;
      }
      setQuestions(updated);
    } else if (pickerTarget.type === 'sequence-step') {
      const updated = [...sequence];
      updated[pickerTarget.index].imageUrl = imageUrl;
      if (label && !updated[pickerTarget.index].text) {
        updated[pickerTarget.index].text = `${pickerTarget.index + 1}. ${label}`;
      }
      setSequence(updated);
    }

    setPickerTarget(null);
  };

  // Manejadores de parejas (Asociación)
  const addPair = () => {
    const newId = `p${Date.now()}`;
    setPairs([
      ...pairs,
      {
        id: newId,
        leftText: '',
        leftImage: 'https://api.arasaac.org/api/pictograms/2410?download=false',
        rightText: '',
        rightImage: 'https://api.arasaac.org/api/pictograms/2410?download=false',
      },
    ]);
  };

  const removePair = (index: number) => {
    if (pairs.length <= 2) {
      setErrorMessage('La actividad de asociación requiere al menos 2 parejas.');
      return;
    }
    setPairs(pairs.filter((_, i) => i !== index));
  };

  // Manejadores de preguntas y opciones (Selección)
  const addQuestion = () => {
    const qId = `q${Date.now()}`;
    setQuestions([
      ...questions,
      {
        id: qId,
        promptText: '',
        promptImage: 'https://api.arasaac.org/api/pictograms/2408?download=false',
        options: [
          { id: `o1-${qId}`, text: '', imageUrl: 'https://api.arasaac.org/api/pictograms/2410?download=false', isCorrect: true },
          { id: `o2-${qId}`, text: '', imageUrl: 'https://api.arasaac.org/api/pictograms/2413?download=false', isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (qIndex: number) => {
    if (questions.length <= 1) {
      setErrorMessage('Debe existir al menos 1 pregunta en la actividad.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== qIndex));
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    const q = updated[qIndex];
    if (q.options.length >= 6) return;
    q.options.push({
      id: `opt-${Date.now()}`,
      text: '',
      imageUrl: 'https://api.arasaac.org/api/pictograms/2418?download=false',
      isCorrect: false,
    });
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) {
      setErrorMessage('Cada pregunta debe tener al menos 2 opciones.');
      return;
    }
    updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
    // Si la eliminada era la correcta, asignar la primera como correcta
    if (!updated[qIndex].options.some((o) => o.isCorrect)) {
      updated[qIndex].options[0].isCorrect = true;
    }
    setQuestions(updated);
  };

  const setCorrectOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === optIndex,
    }));
    setQuestions(updated);
  };

  // Manejadores de pasos (Secuencias)
  const addSequenceStep = () => {
    const sId = `s${Date.now()}`;
    const nextOrder = sequence.length + 1;
    setSequence([
      ...sequence,
      {
        id: sId,
        order: nextOrder,
        text: `${nextOrder}. Nuevo paso`,
        imageUrl: 'https://api.arasaac.org/api/pictograms/2406?download=false',
      },
    ]);
  };

  const removeSequenceStep = (index: number) => {
    if (sequence.length <= 2) {
      setErrorMessage('La secuencia requiere al menos 2 pasos ordenados.');
      return;
    }
    const filtered = sequence.filter((_, i) => i !== index);
    // Reordenar pasos
    const reordered = filtered.map((step, i) => ({
      ...step,
      order: i + 1,
    }));
    setSequence(reordered);
  };

  const moveSequenceStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sequence.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...sequence];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((step, i) => ({
      ...step,
      order: i + 1,
    }));
    setSequence(reordered);
  };

  // Guardar actividad (Crear o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('El título de la actividad es obligatorio.');
      return;
    }

    let config: IActivityConfig = {};

    if (activityType === 'association') {
      if (pairs.length < 2) {
        setErrorMessage('La actividad de asociación requiere al menos 2 parejas.');
        return;
      }
      for (let i = 0; i < pairs.length; i++) {
        if (!pairs[i].leftText.trim() || !pairs[i].rightText.trim()) {
          setErrorMessage(`Por favor completa los textos de la Pareja #${i + 1}.`);
          return;
        }
      }
      config = { pairs };
    } else if (activityType === 'selection') {
      if (questions.length < 1) {
        setErrorMessage('Debes incluir al menos una pregunta.');
        return;
      }
      for (let q = 0; q < questions.length; q++) {
        if (!questions[q].promptText.trim()) {
          setErrorMessage(`Ingresa el enunciado para la Pregunta #${q + 1}.`);
          return;
        }
        if (questions[q].options.length < 2) {
          setErrorMessage(`La Pregunta #${q + 1} necesita al menos 2 opciones.`);
          return;
        }
        const hasCorrect = questions[q].options.some((o) => o.isCorrect);
        if (!hasCorrect) {
          setErrorMessage(`Por favor marca la respuesta correcta en la Pregunta #${q + 1}.`);
          return;
        }
        for (let opt = 0; opt < questions[q].options.length; opt++) {
          if (!questions[q].options[opt].text.trim()) {
            setErrorMessage(`Completa el texto de la opción #${opt + 1} en la Pregunta #${q + 1}.`);
            return;
          }
        }
      }
      config = { questions };
    } else if (activityType === 'sequence') {
      if (sequence.length < 2) {
        setErrorMessage('La secuencia requiere al menos 2 pasos ordenados.');
        return;
      }
      for (let s = 0; s < sequence.length; s++) {
        if (!sequence[s].text.trim()) {
          setErrorMessage(`Completa el texto descriptivo del Paso #${s + 1}.`);
          return;
        }
      }
      config = { sequence };
    }

    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/activities/${initialActivity!._id}`
        : '/api/activities';

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          skillType,
          activityType,
          difficulty,
          instructions: instructions.trim(),
          config,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Ocurrió un error al guardar la actividad.');
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage('Error de red al intentar guardar la actividad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-fade-in">
          {/* Encabezado */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  {isEditing ? 'Editar Actividad Adaptada' : 'Crear Nueva Actividad Adaptada'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Diseño neuroafirmativo con pictogramas ARASAAC, pasos visuales y sin penalizaciones.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Formulario con scroll */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SECCIÓN 1: DATOS GENERALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Título de la Actividad *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Reconocer Animales de la Granja, Lavado de Dientes..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipo de Actividad *
                </label>
                <select
                  value={activityType}
                  disabled={isEditing}
                  onChange={(e) => {
                    const newType = e.target.value as ActivityType;
                    setActivityType(newType);
                    if (newType === 'association' && pairs.length === 0) setPairs(getDefaultPairs());
                    if (newType === 'selection' && questions.length === 0) setQuestions(getDefaultQuestions());
                    if (newType === 'sequence' && sequence.length === 0) setSequence(getDefaultSequence());
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white disabled:bg-slate-100"
                >
                  <option value="association">🔗 Tipo A: Asociación Visual (Emparejar)</option>
                  <option value="selection">🎯 Tipo B: Selección entre Opciones</option>
                  <option value="sequence">🔢 Tipo C: Secuencias Temporales (Pasos)</option>
                </select>
                {isEditing && (
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    El tipo de actividad no puede modificarse una vez creada.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Nivel de Dificultad
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as ActivityDifficulty)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  <option value="facil">Fácil (Iniciación y refuerzo visual)</option>
                  <option value="medio">Medio (Discriminación intermedia)</option>
                  <option value="avanzado">Avanzado (Mayor abstracción y detalle)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Habilidad a Estimular
                </label>
                <input
                  type="text"
                  list="skills-list"
                  value={skillType}
                  onChange={(e) => setSkillType(e.target.value)}
                  placeholder="Ej. Reconocimiento Emocional"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <datalist id="skills-list">
                  {COMMON_SKILLS.map((sk) => (
                    <option key={sk} value={sk} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Descripción breve
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objetivo pedagógico o conductual de la actividad..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Instrucciones amables para el niño (Leídas por voz sintética)
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Ej. Toca cada imagen con calma para ordenarlas como tú prefieras..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* SECCIÓN 2: CONFIGURACIÓN ESPECÍFICA SEGÚN TIPO DE ACTIVIDAD */}
            <div className="pt-4 border-t border-slate-200">
              {/* TIPO A: ASOCIACIÓN VISUAL */}
              {activityType === 'association' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <span>🔗 Parejas de Asociación Visual</span>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {pairs.length} parejas configuradas
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        El niño tocará un elemento a la izquierda y luego su correspondencia a la derecha.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPair}
                      className="font-bold text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Pareja</span>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {pairs.map((pair, idx) => (
                      <div
                        key={pair.id || idx}
                        className="p-4 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center gap-4 relative group"
                      >
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>

                        {/* Columna Izquierda */}
                        <div className="flex-1 flex items-center gap-3 w-full bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                          <button
                            type="button"
                            onClick={() =>
                              setPickerTarget({ type: 'pair-left', index: idx })
                            }
                            className="w-14 h-14 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 flex flex-col items-center justify-center flex-shrink-0 overflow-hidden group/btn transition-colors relative"
                            title="Cambiar pictograma ARASAAC"
                          >
                            {pair.leftImage ? (
                              <img
                                src={pair.leftImage}
                                alt=""
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-amber-600" />
                            )}
                            <span className="absolute inset-0 bg-slate-900/40 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                              Cambiar
                            </span>
                          </button>

                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                              Elemento Izquierda
                            </label>
                            <input
                              type="text"
                              required
                              value={pair.leftText}
                              onChange={(e) => {
                                const updated = [...pairs];
                                updated[idx].leftText = e.target.value;
                                setPairs(updated);
                              }}
                              placeholder="Ej. Manzana"
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        </div>

                        <span className="text-slate-400 font-black text-sm hidden md:inline">⇄</span>

                        {/* Columna Derecha */}
                        <div className="flex-1 flex items-center gap-3 w-full bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                          <button
                            type="button"
                            onClick={() =>
                              setPickerTarget({ type: 'pair-right', index: idx })
                            }
                            className="w-14 h-14 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 flex flex-col items-center justify-center flex-shrink-0 overflow-hidden group/btn transition-colors relative"
                            title="Cambiar pictograma ARASAAC"
                          >
                            {pair.rightImage ? (
                              <img
                                src={pair.rightImage}
                                alt=""
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-amber-600" />
                            )}
                            <span className="absolute inset-0 bg-slate-900/40 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                              Cambiar
                            </span>
                          </button>

                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                              Pareja Derecha (Correspondencia)
                            </label>
                            <input
                              type="text"
                              required
                              value={pair.rightText}
                              onChange={(e) => {
                                const updated = [...pairs];
                                updated[idx].rightText = e.target.value;
                                setPairs(updated);
                              }}
                              placeholder="Ej. Fruta"
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        </div>

                        {/* Eliminar Pareja */}
                        {pairs.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removePair(idx)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Eliminar pareja"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIPO B: SELECCIÓN ENTRE OPCIONES (PREGUNTAS Y RESPUESTA CORRECTA) */}
              {activityType === 'selection' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <span>🎯 Preguntas y Selección de Respuesta Correcta</span>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {questions.length} pregunta(s)
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Cada pregunta incluye un pictograma o enunciado, opciones y la marca clara de cuál es la respuesta correcta.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addQuestion}
                      className="font-bold text-xs gap-1 border-sky-300 text-sky-700 hover:bg-sky-50 self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Otra Pregunta</span>
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {questions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="p-5 rounded-3xl bg-slate-50 border-2 border-slate-200 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs font-black uppercase text-sky-700 bg-sky-100 px-3 py-1 rounded-full">
                            Pregunta #{qIdx + 1}
                          </span>

                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(qIdx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                              title="Eliminar pregunta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Enunciado y Pictograma de la Pregunta */}
                        <div className="flex items-start gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                          <button
                            type="button"
                            onClick={() =>
                              setPickerTarget({ type: 'question-prompt', index: qIdx })
                            }
                            className="w-16 h-16 rounded-2xl border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 flex flex-col items-center justify-center flex-shrink-0 overflow-hidden group/btn transition-colors relative"
                            title="Cambiar pictograma principal de la pregunta"
                          >
                            {q.promptImage ? (
                              <img
                                src={q.promptImage}
                                alt=""
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-sky-600" />
                            )}
                            <span className="absolute inset-0 bg-slate-900/40 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                              Pictograma
                            </span>
                          </button>

                          <div className="flex-1">
                            <label className="text-xs font-black text-slate-700 uppercase block mb-1">
                              Enunciado o Pregunta *
                            </label>
                            <input
                              type="text"
                              required
                              value={q.promptText}
                              onChange={(e) => {
                                const updated = [...questions];
                                updated[qIdx].promptText = e.target.value;
                                setQuestions(updated);
                              }}
                              placeholder="Ej. ¿Cuál de estos objetos se usa para dibujar?"
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-1 focus:ring-sky-500"
                            />
                            <span className="text-[11px] text-slate-400 mt-1 block">
                              Puedes tocar el recuadro a la izquierda para elegir el pictograma ilustrativo.
                            </span>
                          </div>
                        </div>

                        {/* Opciones con Selección de Respuesta Correcta */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                              Opciones de Respuesta (Marca la casilla verde en la opción correcta)
                            </label>
                            {q.options.length < 6 && (
                              <button
                                type="button"
                                onClick={() => addOption(qIdx)}
                                className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Añadir opción</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={opt.id || optIdx}
                                className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                                  opt.isCorrect
                                    ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                {/* Botón para cambiar pictograma de la opción */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPickerTarget({
                                      type: 'question-option',
                                      index: qIdx,
                                      subIndex: optIdx,
                                    })
                                  }
                                  className="w-12 h-12 rounded-xl border border-slate-300 hover:border-sky-400 bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden relative group/btn"
                                  title="Elegir pictograma para esta opción"
                                >
                                  {opt.imageUrl ? (
                                    <img
                                      src={opt.imageUrl}
                                      alt=""
                                      className="w-full h-full object-contain p-1"
                                    />
                                  ) : (
                                    <ImageIcon className="w-5 h-5 text-slate-400" />
                                  )}
                                  <span className="absolute inset-0 bg-slate-900/40 text-white text-[8px] font-bold flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                                    Icono
                                  </span>
                                </button>

                                <div className="flex-1">
                                  <input
                                    type="text"
                                    required
                                    value={opt.text}
                                    onChange={(e) => {
                                      const updated = [...questions];
                                      updated[qIdx].options[optIdx].text = e.target.value;
                                      setQuestions(updated);
                                    }}
                                    placeholder={`Opción #${optIdx + 1}`}
                                    className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold focus:ring-1 focus:ring-sky-500 mb-1"
                                  />

                                  {/* Botón de Selección de Respuesta Correcta */}
                                  <button
                                    type="button"
                                    onClick={() => setCorrectOption(qIdx, optIdx)}
                                    className={`w-full text-[11px] font-black py-1 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                      opt.isCorrect
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{opt.isCorrect ? 'Respuesta Correcta' : 'Hacer Correcta'}</span>
                                  </button>
                                </div>

                                {q.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(qIdx, optIdx)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                                    title="Eliminar opción"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIPO C: SECUENCIAS TEMPORALES (PASOS ORDENADOS) */}
              {activityType === 'sequence' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <span>🔢 Pasos de la Secuencia Temporal</span>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {sequence.length} pasos ordenados
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Configura el orden cronológico de cada paso con su pictograma y texto claro.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSequenceStep}
                      className="font-bold text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Paso</span>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {sequence.map((step, sIdx) => (
                      <div
                        key={step.id || sIdx}
                        className="p-4 rounded-3xl bg-slate-50 border border-slate-200 flex items-center gap-3 group"
                      >
                        {/* Badge de Orden */}
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                          {sIdx + 1}
                        </div>

                        {/* Pictograma del Paso */}
                        <button
                          type="button"
                          onClick={() =>
                            setPickerTarget({ type: 'sequence-step', index: sIdx })
                          }
                          className="w-14 h-14 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white flex flex-col items-center justify-center flex-shrink-0 overflow-hidden relative group/btn transition-colors"
                          title="Cambiar pictograma del paso"
                        >
                          {step.imageUrl ? (
                            <img
                              src={step.imageUrl}
                              alt=""
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-amber-600" />
                          )}
                          <span className="absolute inset-0 bg-slate-900/40 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                            Pictograma
                          </span>
                        </button>

                        {/* Texto del Paso */}
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Descripción del Paso #{sIdx + 1}
                          </label>
                          <input
                            type="text"
                            required
                            value={step.text}
                            onChange={(e) => {
                              const updated = [...sequence];
                              updated[sIdx].text = e.target.value;
                              setSequence(updated);
                            }}
                            placeholder={`Ej. ${sIdx + 1}. Mojar las manos con agua`}
                            className="w-full px-3.5 py-1.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        {/* Reordenar y Eliminar */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={sIdx === 0}
                            onClick={() => moveSequenceStep(sIdx, 'up')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400"
                            title="Subir paso"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={sIdx === sequence.length - 1}
                            onClick={() => moveSequenceStep(sIdx, 'down')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400"
                            title="Bajar paso"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          {sequence.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeSequenceStep(sIdx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 ml-1"
                              title="Eliminar paso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción al final del modal */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="font-bold shadow-md min-w-[10rem]"
              >
                {isSubmitting
                  ? 'Guardando...'
                  : isEditing
                  ? 'Guardar Cambios'
                  : 'Crear en Biblioteca'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Selector de Pictogramas ARASAAC */}
      <PictogramPickerModal
        isOpen={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        onSelect={handlePictogramSelect}
        title="Elegir Pictograma ARASAAC para Actividad"
      />
    </>
  );
};
