'use client';

import { useState, useEffect } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  GripVertical,
} from 'lucide-react';

interface LayersPanelProps {
  canvas: Canvas | null;
  onUpdate: () => void;
}

interface LayerItem {
  id: string;
  object: FabricObject;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
}

function LayerIcon({ type }: { type: string }) {
  switch (type) {
    case 'i-text':
    case 'text':
      return <Type className="h-4 w-4" />;
    case 'rect':
      return <Square className="h-4 w-4" />;
    case 'circle':
      return <Circle className="h-4 w-4" />;
    case 'image':
      return <ImageIcon className="h-4 w-4" />;
    default:
      return <Square className="h-4 w-4" />;
  }
}

function SortableLayerItem({
  layer,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
}: {
  layer: LayerItem;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all
        ${isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-100'}
        ${!layer.visible ? 'opacity-50' : ''}
      `}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle - visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className={`cursor-grab active:cursor-grabbing transition-opacity ${isHovered || isDragging ? 'opacity-100' : 'opacity-0'}`}
      >
        <GripVertical className="h-3.5 w-3.5 text-slate-400" />
      </div>

      {/* Layer Icon */}
      <div className="text-slate-500">
        <LayerIcon type={layer.type} />
      </div>

      {/* Layer Name */}
      <span className="flex-1 text-xs truncate">{layer.name}</span>

      {/* Actions - visible on hover */}
      <div className={`flex items-center gap-0.5 transition-opacity ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'}`}>
        <button
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          title={layer.visible ? 'Hide' : 'Show'}
        >
          {layer.visible ? (
            <Eye className="h-3 w-3 text-slate-600" />
          ) : (
            <EyeOff className="h-3 w-3 text-slate-400" />
          )}
        </button>

        <button
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          title={layer.locked ? 'Unlock' : 'Lock'}
        >
          {layer.locked ? (
            <Lock className="h-3 w-3 text-slate-600" />
          ) : (
            <Unlock className="h-3 w-3 text-slate-400" />
          )}
        </button>

        <button
          className="h-5 w-5 rounded hover:bg-red-100 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete"
        >
          <Trash2 className="h-3 w-3 text-slate-600 hover:text-red-600" />
        </button>
      </div>
    </div>
  );
}

export function LayersPanel({ canvas, onUpdate }: LayersPanelProps) {
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load layers from canvas
  useEffect(() => {
    if (!canvas) {
      setLayers([]);
      return;
    }

    const updateLayers = () => {
      const objects = canvas.getObjects();
      const layerItems: LayerItem[] = objects.map((obj, index) => {
        const objectAny = obj as any;
        return {
          id: objectAny._id || `layer-${index}`,
          object: obj,
          name: objectAny.name || `${obj.type || 'Object'} ${index + 1}`,
          type: obj.type || 'unknown',
          visible: obj.visible !== false,
          locked: obj.selectable === false,
        };
      }).reverse(); // Reverse to show top layers first

      setLayers(layerItems);

      // Update selected layer
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        const activeAny = activeObject as any;
        setSelectedLayerId(activeAny._id || null);
      } else {
        setSelectedLayerId(null);
      }
    };

    updateLayers();

    // Listen for canvas changes
    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('object:modified', updateLayers);
    canvas.on('selection:created', updateLayers);
    canvas.on('selection:updated', updateLayers);
    canvas.on('selection:cleared', updateLayers);

    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
      canvas.off('object:modified', updateLayers);
      canvas.off('selection:created', updateLayers);
      canvas.off('selection:updated', updateLayers);
      canvas.off('selection:cleared', updateLayers);
    };
  }, [canvas]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!canvas || !over || active.id === over.id) return;

    const oldIndex = layers.findIndex((layer) => layer.id === active.id);
    const newIndex = layers.findIndex((layer) => layer.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder layers
    const newLayers = arrayMove(layers, oldIndex, newIndex);
    setLayers(newLayers);

    // Update canvas z-index (reverse because layers are displayed reversed)
    const objects = canvas.getObjects();
    const reversedNewLayers = [...newLayers].reverse();
    reversedNewLayers.forEach((layer, index) => {
      const objIndex = objects.indexOf(layer.object);
      if (objIndex !== -1) {
        layer.object.moveTo(index);
      }
    });

    canvas.renderAll();
    onUpdate();
  };

  const handleSelectLayer = (layer: LayerItem) => {
    if (!canvas) return;
    canvas.setActiveObject(layer.object);
    canvas.renderAll();
    setSelectedLayerId(layer.id);
  };

  const handleToggleVisibility = (layer: LayerItem) => {
    if (!canvas) return;
    layer.object.set('visible', !layer.visible);
    canvas.renderAll();
    onUpdate();
  };

  const handleToggleLock = (layer: LayerItem) => {
    if (!canvas) return;
    const newLocked = !layer.locked;
    layer.object.set('selectable', !newLocked);
    layer.object.set('evented', !newLocked);
    canvas.renderAll();
    onUpdate();
  };

  const handleDeleteLayer = (layer: LayerItem) => {
    if (!canvas) return;
    canvas.remove(layer.object);
    canvas.renderAll();
    onUpdate();
  };

  return (
    <Card className="w-full p-3 h-full overflow-y-auto border-0 rounded-none">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Layers</h3>
          <span className="text-xs text-muted-foreground">{layers.length}</span>
        </div>

        {layers.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No layers yet. Add objects to the canvas.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={layers.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {layers.map((layer) => (
                  <SortableLayerItem
                    key={layer.id}
                    layer={layer}
                    isSelected={layer.id === selectedLayerId}
                    onSelect={() => handleSelectLayer(layer)}
                    onToggleVisibility={() => handleToggleVisibility(layer)}
                    onToggleLock={() => handleToggleLock(layer)}
                    onDelete={() => handleDeleteLayer(layer)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </Card>
  );
}
