"use client";

/**
 * PROFESSIONAL CANVAS EDITOR - Canva-Like UX
 * Built with Fabric.js v6 best practices
 *
 * NEW ARCHITECTURE:
 * - Loads data from database using session ID (no sessionStorage)
 * - Dynamically imports Fabric.js to avoid bundling issues
 * - Simple, clean data flow with server-side persistence
 */

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, ZoomIn, ZoomOut, Maximize2, Type, Square, Circle, Upload, Library, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditorData {
  backgroundImage: string;
  qrCodeDataUrl: string;
  trackingId: string;
  landingPageUrl: string;
  recipientName: string;
  recipientLastname: string;
  recipientAddress: string;
  recipientCity: string;
  recipientZip: string;
  message: string;
  companyName: string;
  campaignName?: string;
  campaignId?: number;
  logoUrl?: string;
  primaryColor?: string;
  textColor?: string;
  canvasWidth: number;
  canvasHeight: number;
  phoneNumber: string;
  dmTemplateId?: number; // Template ID if loading from saved template
}

export default function CanvasEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const fabricRef = useRef<any>(null); // Store fabric namespace

  const [editorData, setEditorData] = useState<EditorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "general",
    targetAudience: "",
    tone: "",
    industry: "",
  });

  // Load Fabric.js dynamically and fetch session data
  useEffect(() => {
    const loadFabricAndData = async () => {
      console.log('🎨 Loading Fabric.js and session data...');

      if (!sessionId) {
        toast.error("No session ID provided");
        router.push("/dm-creative");
        return;
      }

      try {
        // 1. Load Fabric.js dynamically
        console.log('📦 Loading Fabric.js library...');
        const fabricModule = await import('fabric');
        // Fabric.js v6 uses named exports, not default export
        fabricRef.current = fabricModule;
        console.log('✅ Fabric.js loaded successfully');
        console.log('Module keys:', Object.keys(fabricModule).slice(0, 20));

        // 2. Fetch session data from database
        console.log('🔍 Fetching session data:', sessionId);
        const response = await fetch(`/api/canvas-session?id=${sessionId}`);
        const result = await response.json();

        if (!result.success || !result.data) {
          toast.error("Session not found");
          router.push("/dm-creative");
          return;
        }

        const data = result.data;
        console.log('✅ Session data loaded:', {
          hasBackground: !!data.backgroundImage,
          hasQR: !!data.qrCodeDataUrl,
          hasLogo: !!data.logoUrl,
          dimensions: `${data.canvasWidth}x${data.canvasHeight}`,
        });

        setEditorData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error loading:', error);
        toast.error("Failed to load editor");
        router.push("/dm-creative");
      }
    };

    loadFabricAndData();
  }, [sessionId, router]);

  // Initialize canvas when data is ready
  useEffect(() => {
    if (!canvasRef.current || !editorData || !fabricRef.current || fabricCanvasRef.current) {
      return;
    }

    // Flag to prevent operations after cleanup (React StrictMode double-mount protection)
    let isActive = true;

    const fabricModule = fabricRef.current;
    console.log('🎨 Initializing canvas with Fabric.js');
    console.log('Fabric module keys:', Object.keys(fabricModule).slice(0, 20));

    try {
      // Use named exports from Fabric.js v6
      const { Canvas, FabricImage } = fabricModule;
      console.log('Canvas class:', Canvas?.name);
      console.log('FabricImage class:', FabricImage?.name);

      // Create canvas using Canvas class
      const canvas = new Canvas(canvasRef.current, {
        width: editorData.canvasWidth,
        height: editorData.canvasHeight,
        backgroundColor: "#ffffff",
      });

      fabricCanvasRef.current = canvas;
      console.log('✅ Canvas initialized');
      console.log('Canvas type:', canvas.constructor.name);
      console.log('Has setBackgroundImage:', typeof canvas.setBackgroundImage);
      console.log('Canvas methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(canvas)).filter(m => m.includes('Background')));

      // Check if we should load from template
      if (editorData.dmTemplateId) {
        console.log('📋 Loading template design:', editorData.dmTemplateId);
        // Pass isActive flag to loadTemplateDesign
        loadTemplateDesign(canvas, editorData, fabricModule, isActive);
      } else {
        // Load background using FabricImage (standard flow)
        FabricImage.fromURL(editorData.backgroundImage, {crossOrigin: 'anonymous'}).then((img: any) => {
          if (!isActive) {
            console.log('⏭️ Component unmounted, skipping background load');
            return;
          }
          console.log('✅ Background image loaded');
          img.set({
            scaleX: editorData.canvasWidth / (img.width || editorData.canvasWidth),
            scaleY: editorData.canvasHeight / (img.height || editorData.canvasHeight),
            selectable: false,
            evented: false,
          });

          // Fabric.js v6: setBackgroundImage is deprecated, set property directly
          canvas.backgroundImage = img;
          canvas.renderAll();
          console.log('✅ Background set on canvas');

          if (isActive) {
            addDMElements(canvas, editorData, fabricModule);
          }
        }).catch((err: any) => {
          if (isActive) {
            console.error('❌ Error loading background:', err);
            toast.error('Failed to load background image');
          }
        });
      }

    } catch (error) {
      if (isActive) {
        console.error('❌ Error initializing canvas:', error);
        toast.error('Failed to initialize canvas');
      }
    }

    return () => {
      // Set flag to prevent async operations from completing
      isActive = false;
      console.log('🧹 Cleaning up canvas...');
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [editorData]);

  // Set default template name when editor data loads
  useEffect(() => {
    if (editorData && !templateForm.name) {
      const defaultName = editorData.campaignName
        || `DM Template - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      setTemplateForm(prev => ({ ...prev, name: defaultName }));
    }
  }, [editorData]);

  // Add all DM elements
  const addDMElements = async (canvas: any, data: EditorData, fabricModule: any) => {
    console.log('🎯 Adding DM elements');

    const { FabricImage, Textbox, IText } = fabricModule;
    const padding = 30;
    const primaryColor = data.primaryColor || "#003E7E";
    const textColor = data.textColor || "#1F2937";

    // Logo - MARK as reusable (NOT variable)
    if (data.logoUrl) {
      console.log('🏷️ Adding logo');
      try {
        const logoImg = await FabricImage.fromURL(data.logoUrl, {crossOrigin: 'anonymous'});
        logoImg.set({
          left: padding,
          top: padding,
          scaleX: 150 / (logoImg.width || 150),
          scaleY: 70 / (logoImg.height || 70),
          variableType: 'logo', // IMPORTANT: Mark as logo (reusable, NOT replaceable)
          isReusable: true, // Flag for batch processing
        });
        canvas.add(logoImg);
        console.log('✅ Logo added');
      } catch (err) {
        console.error('❌ Error loading logo:', err);
      }
    }

    // Message - MARK as variable field
    const messageText = new Textbox(data.message, {
      left: padding,
      top: padding + 90,
      width: 400,
      fontSize: 20,
      fontFamily: "Arial",
      fill: textColor,
      variableType: 'message', // Custom property for identification
    });
    canvas.add(messageText);

    // Customer name - MARK as variable field
    const customerName = new IText(`${data.recipientName} ${data.recipientLastname}`, {
      left: padding,
      top: data.canvasHeight - 120,
      fontSize: 16,
      fontFamily: "Arial",
      fill: "#6B7280",
      variableType: 'recipientName', // Custom property for identification
    });
    canvas.add(customerName);

    // Address - MARK as variable field
    if (data.recipientAddress) {
      const address = new IText(
        `${data.recipientAddress}, ${data.recipientCity}, ${data.recipientZip}`,
        {
          left: padding,
          top: data.canvasHeight - 90,
          fontSize: 14,
          fontFamily: "Arial",
          fill: "#6B7280",
          variableType: 'recipientAddress', // Custom property for identification
        }
      );
      canvas.add(address);
    }

    // Phone - MARK as variable field
    const phone = new IText(`📞 ${data.phoneNumber}`, {
      left: padding,
      top: data.canvasHeight - 60,
      fontSize: 18,
      fontFamily: "Arial",
      fontWeight: "bold",
      fill: primaryColor,
      variableType: 'phoneNumber', // Custom property for identification
    });
    canvas.add(phone);

    // QR Code - MARK as variable field
    console.log('📱 Adding QR code');
    try {
      const qrImg = await FabricImage.fromURL(data.qrCodeDataUrl, {crossOrigin: 'anonymous'});
      qrImg.set({
        left: data.canvasWidth - 180 - padding,
        top: data.canvasHeight - 180 - padding,
        scaleX: 150 / (qrImg.width || 150),
        scaleY: 150 / (qrImg.height || 150),
        variableType: 'qrCode', // Custom property for identification
      });
      canvas.add(qrImg);
      console.log('✅ QR code added');
    } catch (err) {
      console.error('❌ Error loading QR:', err);
    }

    canvas.renderAll();
    console.log('✅ All elements added');

    // DEBUG: Verify custom properties were set on canvas objects
    console.log('🔍 Verifying custom properties on canvas objects:');
    const objects = canvas.getObjects();
    objects.forEach((obj: any, idx: number) => {
      console.log(`   Object ${idx}: type=${obj.type}, variableType=${obj.variableType}, isReusable=${obj.isReusable}`);
    });
  };

  // Load template design from saved DM template
  const loadTemplateDesign = async (canvas: any, data: EditorData, fabricModule: any, isActive?: boolean) => {
    console.log('📋 Loading template design:', data.dmTemplateId);

    try {
      // Fetch DM template
      const response = await fetch(`/api/dm-template?id=${data.dmTemplateId}`);
      const result = await response.json();

      // Check if canvas is still valid after async fetch
      if (!canvas || canvas.disposed) {
        console.log('⏭️ Canvas disposed during template fetch, aborting');
        return;
      }

      if (!result.success || !result.data) {
        console.error('❌ Failed to load template');
        toast.error('Template not found, using standard layout');
        // Fallback to standard flow
        const { FabricImage } = fabricModule;
        FabricImage.fromURL(data.backgroundImage, {crossOrigin: 'anonymous'}).then((img: any) => {
          // Check if canvas is still valid (safely)
          if (!canvas || canvas.disposed) {
            console.log('⏭️ Canvas disposed, skipping fallback');
            return;
          }
          img.set({
            scaleX: data.canvasWidth / (img.width || data.canvasWidth),
            scaleY: data.canvasHeight / (img.height || data.canvasHeight),
            selectable: false,
            evented: false,
          });
          canvas.backgroundImage = img;
          canvas.renderAll();
          addDMElements(canvas, data, fabricModule);
        });
        return;
      }

      const template = result.data;
      console.log('✅ Template loaded:', template.name);

      // Parse canvas JSON
      const canvasJSON = JSON.parse(template.canvasJSON);
      console.log('📦 Loading canvas from JSON...');

      // Check if canvas is still valid before loadFromJSON
      if (!canvas || canvas.disposed) {
        console.log('⏭️ Canvas disposed before loadFromJSON, aborting');
        return;
      }

      // Load canvas from JSON and restore variable mappings
      canvas.loadFromJSON(canvasJSON).then(async () => {
        // Check if canvas is still valid after async load
        if (!canvas || canvas.disposed) {
          console.log('⏭️ Canvas disposed after loadFromJSON, aborting');
          return;
        }
        console.log('✅ Canvas loaded from template');

        // CRITICAL FIX: Apply variable mappings from separate storage
        // Fabric.js v6 doesn't serialize custom properties, so we store them separately
        const objects = canvas.getObjects();
        console.log(`📊 Canvas has ${objects.length} objects, applying variable mappings...`);

        // Parse variable mappings from template
        let variableMappings: Record<string, { variableType?: string; isReusable?: boolean }> = {};
        if (template.variableMappings) {
          try {
            variableMappings = JSON.parse(template.variableMappings);
            console.log(`📦 Loaded ${Object.keys(variableMappings).length} variable mappings from template`);
          } catch (error) {
            console.error('❌ Failed to parse variable mappings:', error);
          }
        }

        // Apply mappings to canvas objects by index
        let hasVariableTypes = 0;
        let hasReusableFlags = 0;

        Object.entries(variableMappings).forEach(([indexStr, mapping]) => {
          const idx = parseInt(indexStr);
          if (idx >= 0 && idx < objects.length) {
            const obj = objects[idx];
            if (mapping.variableType) {
              obj.variableType = mapping.variableType;
              hasVariableTypes++;
            }
            if (mapping.isReusable !== undefined) {
              obj.isReusable = mapping.isReusable;
              hasReusableFlags++;
            }
            console.log(`   ✅ Applied mapping to Object ${idx}: variableType=${obj.variableType}, isReusable=${obj.isReusable}`);
          }
        });

        console.log(`📊 Summary: ${hasVariableTypes} objects with variableType, ${hasReusableFlags} with isReusable flag`);

        if (hasVariableTypes === 0) {
          console.warn('⚠️ WARNING: No objects have variableType markers! Template may be outdated.');
          toast.error('Template is missing markers. Please recreate template with latest version.');
          return;
        }

        // Update variable fields with current recipient data (AWAIT this)
        await updateTemplateVariables(canvas, data, fabricModule);

        // NO duplicate renderAll - updateTemplateVariables already calls it
        toast.success(`Template "${template.name}" loaded successfully`);
      }).catch((err: any) => {
        console.error('❌ Error loading canvas JSON:', err);
        toast.error('Failed to load template design');
      });

    } catch (error) {
      console.error('❌ Error loading template:', error);
      toast.error('Failed to load template');
    }
  };

  // Update variable fields in template with current recipient data
  const updateTemplateVariables = async (canvas: any, data: EditorData, fabricModule: any) => {
    console.log('🔄 Updating template variables with recipient data');
    console.log('📋 Recipient data:', {
      name: data.recipientName,
      lastname: data.recipientLastname,
      address: data.recipientAddress,
      city: data.recipientCity,
      zip: data.recipientZip,
      message: data.message?.substring(0, 50) + '...',
      hasQR: !!data.qrCodeDataUrl,
      phone: data.phoneNumber,
    });

    const { FabricImage } = fabricModule;
    const objects = canvas.getObjects();
    const replacements: Promise<void>[] = [];

    console.log(`📊 Processing ${objects.length} objects in template`);

    // Process each object
    for (const obj of objects) {
      // Use variableType marker for reliable detection
      const varType = obj.variableType;
      const isReusable = obj.isReusable;

      // Skip objects without markers
      if (!varType) {
        console.log(`⏭️ Skipping unmarked object (type: ${obj.type})`);
        continue;
      }

      // PRESERVE reusable elements (logo, background elements)
      if (isReusable) {
        console.log(`🔒 Preserving reusable element: ${varType}`);
        continue; // Do NOT modify reusable elements
      }

      // === TEXT FIELD REPLACEMENTS (variable data) ===
      if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
        switch (varType) {
          case 'message':
            obj.set({ text: data.message });
            console.log('📝 Updated message field');
            break;

          case 'recipientName':
            obj.set({ text: `${data.recipientName} ${data.recipientLastname}` });
            console.log('👤 Updated recipient name');
            break;

          case 'recipientAddress':
            const address = `${data.recipientAddress}, ${data.recipientCity}, ${data.recipientZip}`;
            obj.set({ text: address });
            console.log('📍 Updated recipient address');
            break;

          case 'phoneNumber':
            obj.set({ text: `📞 ${data.phoneNumber}` });
            console.log('📞 Updated phone number');
            break;

          default:
            console.log(`⚠️ Unknown text field type: ${varType}`);
        }
      }

      // === QR CODE REPLACEMENT (variable data) ===
      // ONLY replace if explicitly marked as 'qrCode' AND is an image
      if (varType === 'qrCode' && obj.type === 'image') {
        console.log('🔄 Replacing QR code with new tracking ID');
        console.log(`   Old QR position: (${obj.left}, ${obj.top}), scale: (${obj.scaleX}, ${obj.scaleY})`);

        const replacement = FabricImage.fromURL(data.qrCodeDataUrl, {crossOrigin: 'anonymous'})
          .then((newQR: any) => {
            // Verify canvas is still valid
            if (!canvas || canvas.disposed) {
              console.error('❌ Canvas disposed, skipping QR replacement');
              return;
            }

            // CRITICAL: Preserve original QR code's displayed size
            // Calculate old QR code's actual displayed dimensions (accounting for scale)
            const oldQRDisplayWidth = (obj.width || 150) * (obj.scaleX || 1);
            const oldQRDisplayHeight = (obj.height || 150) * (obj.scaleY || 1);

            // Use the smaller dimension to ensure square aspect ratio
            const oldQRDisplaySize = Math.min(oldQRDisplayWidth, oldQRDisplayHeight);

            // Calculate new scale to match old display size
            const qrNaturalSize = newQR.width || 300; // QR codes are square
            const properScale = oldQRDisplaySize / qrNaturalSize;

            console.log(`   QR natural size: ${qrNaturalSize}x${qrNaturalSize}, preserving old size: ${oldQRDisplaySize.toFixed(2)}x${oldQRDisplaySize.toFixed(2)}, scale: ${properScale.toFixed(4)}`);

            // Transfer position and properties from old QR
            newQR.set({
              left: obj.left,
              top: obj.top,
              scaleX: properScale, // Use calculated scale (1:1 ratio)
              scaleY: properScale, // Same scale for both (square)
              angle: obj.angle || 0,
              variableType: 'qrCode', // Preserve marker
              isReusable: false, // QR code is variable (changes per recipient)
            });

            // Remove old and add new (batch operations to avoid intermediate renders)
            canvas.remove(obj);
            canvas.add(newQR);

            console.log('✅ QR code replaced successfully');
          })
          .catch((err: any) => {
            console.error('❌ Error updating QR code:', err);
          });

        replacements.push(replacement);
      }

      // === SAFETY CHECK: Never touch logo ===
      if (varType === 'logo') {
        console.log('🛡️ SAFETY: Logo detected but should be preserved (isReusable check)');
        // This should never happen because we already checked isReusable above
        // But adding explicit check for extra safety
        continue;
      }
    }

    // Wait for all async replacements to complete
    console.log(`⏳ Waiting for ${replacements.length} async replacements...`);
    await Promise.all(replacements);

    // Render once after all updates (with safety check)
    if (canvas && !canvas.disposed) {
      canvas.renderAll();
      console.log('✅ Template variables updated successfully');
    } else {
      console.error('❌ Canvas disposed, cannot render');
      throw new Error('Canvas disposed');
    }
  };

  // Toolbar functions
  const addText = () => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const { IText } = fabricRef.current;
    const text = new IText("Click to edit", {
      left: 100,
      top: 100,
      fontSize: 24,
      fill: "#000000",
    });
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  };

  const addRectangle = () => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const { Rect } = fabricRef.current;
    const rect = new Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      fill: "#4F46E5",
    });
    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.renderAll();
  };

  const addCircle = () => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const { Circle } = fabricRef.current;
    const circle = new Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: "#10B981",
    });
    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.renderAll();
  };

  // Save as reusable template (NEW - saves both campaign_template + dm_template)
  const handleSaveAsTemplate = async () => {
    if (!fabricCanvasRef.current || !editorData) {
      toast.error("Canvas not ready");
      return;
    }

    // Validate required fields
    if (!templateForm.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    try {
      setIsSavingTemplate(true);

      // Deselect all objects
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();

      // Export canvas as JSON (standard properties only - custom properties don't serialize properly in Fabric.js v6)
      const canvasJSON = fabricCanvasRef.current.toJSON([
        'id', 'selectable', 'evented', 'lockMovementX', 'lockMovementY'
      ]);

      // CRITICAL FIX: Create variable mappings from actual canvas objects
      // Map object index → variable markers (bypasses Fabric.js serialization issue)
      const objects = fabricCanvasRef.current.getObjects();
      const variableMappings: Record<string, { variableType?: string; isReusable?: boolean }> = {};

      console.log('📸 Creating variable mappings from canvas objects');
      objects.forEach((obj: any, idx: number) => {
        if (obj.variableType || obj.isReusable !== undefined) {
          variableMappings[idx.toString()] = {
            variableType: obj.variableType,
            isReusable: obj.isReusable
          };
          console.log(`   Mapped Object ${idx}: variableType=${obj.variableType}, isReusable=${obj.isReusable}`);
        }
      });

      console.log(`📊 Created mappings for ${Object.keys(variableMappings).length} objects`);

      // Generate preview image
      const previewImage = fabricCanvasRef.current.toDataURL({
        format: "png",
        quality: 0.8,
        multiplier: 0.5,
      });

      console.log("💾 Saving as full template (campaign + design)...");

      // Call unified save API
      const response = await fetch('/api/templates/save-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignData: {
            name: templateForm.name,
            description: templateForm.description,
            category: templateForm.category,
            message: editorData.message,
            targetAudience: templateForm.targetAudience,
            tone: templateForm.tone,
            industry: templateForm.industry,
          },
          dmData: {
            campaignId: editorData.campaignId,
            canvasSessionId: sessionId,
            name: templateForm.name,
            canvasJSON: JSON.stringify(canvasJSON),
            backgroundImage: editorData.backgroundImage,
            canvasWidth: editorData.canvasWidth,
            canvasHeight: editorData.canvasHeight,
            previewImage,
            variableMappings: JSON.stringify(variableMappings),
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save template');
      }

      console.log(`✅ Full template saved! Campaign: ${result.data.campaignTemplateId}, DM: ${result.data.dmTemplateId}`);

      toast.success("Template saved successfully!");
      setShowTemplateModal(false);

      // Navigate to Template Library
      setTimeout(() => {
        router.push('/analytics?tab=templates');
      }, 1000);

    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Save and continue (EXISTING - keeps current single-use workflow)
  const handleSave = async () => {
    if (!fabricCanvasRef.current || !editorData) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      toast.loading("Saving template...");

      // Deselect all objects
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();

      // Export canvas as JSON (standard properties only - custom properties don't serialize properly in Fabric.js v6)
      const canvasJSON = fabricCanvasRef.current.toJSON([
        'id', 'selectable', 'evented', 'lockMovementX', 'lockMovementY'
      ]);

      // CRITICAL FIX: Create variable mappings from actual canvas objects
      // Map object index → variable markers (bypasses Fabric.js serialization issue)
      const objects = fabricCanvasRef.current.getObjects();
      const variableMappings: Record<string, { variableType?: string; isReusable?: boolean }> = {};

      console.log('💾 Save and Continue - Creating variable mappings from canvas objects');
      objects.forEach((obj: any, idx: number) => {
        if (obj.variableType || obj.isReusable !== undefined) {
          variableMappings[idx.toString()] = {
            variableType: obj.variableType,
            isReusable: obj.isReusable
          };
          console.log(`   Mapped Object ${idx}: variableType=${obj.variableType}, isReusable=${obj.isReusable}`);
        }
      });

      console.log(`📊 Created mappings for ${Object.keys(variableMappings).length} objects`);

      // Generate preview image (smaller size for storage)
      const previewImage = fabricCanvasRef.current.toDataURL({
        format: "png",
        quality: 0.8,
        multiplier: 0.5, // 50% size for preview
      });

      // Save to database
      const response = await fetch('/api/dm-template/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: editorData.campaignId,
          canvasSessionId: sessionId,
          name: editorData.campaignName || `DM Template - ${new Date().toLocaleDateString()}`,
          canvasJSON: JSON.stringify(canvasJSON),
          backgroundImage: editorData.backgroundImage,
          canvasWidth: editorData.canvasWidth,
          canvasHeight: editorData.canvasHeight,
          previewImage,
          variableMappings: JSON.stringify(variableMappings),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save template');
      }

      toast.dismiss();
      toast.success("Template saved successfully!");

      // Navigate to results page with template ID
      router.push(`/dm-creative/results?template=${result.templateId}`);

    } catch (error) {
      toast.dismiss();
      console.error('Error saving template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    }
  };

  const handleZoomIn = () => {
    if (!fabricCanvasRef.current || !editorData) return;
    const newZoom = Math.min(zoomLevel + 10, 200);
    setZoomLevel(newZoom);
    const factor = newZoom / 100;
    fabricCanvasRef.current.setZoom(factor);
    fabricCanvasRef.current.setDimensions({
      width: editorData.canvasWidth * factor,
      height: editorData.canvasHeight * factor,
    });
    fabricCanvasRef.current.renderAll();
  };

  const handleZoomOut = () => {
    if (!fabricCanvasRef.current || !editorData) return;
    const newZoom = Math.max(zoomLevel - 10, 25);
    setZoomLevel(newZoom);
    const factor = newZoom / 100;
    fabricCanvasRef.current.setZoom(factor);
    fabricCanvasRef.current.setDimensions({
      width: editorData.canvasWidth * factor,
      height: editorData.canvasHeight * factor,
    });
    fabricCanvasRef.current.renderAll();
  };

  const handleZoomFit = () => {
    if (!fabricCanvasRef.current || !editorData) return;
    setZoomLevel(100);
    fabricCanvasRef.current.setZoom(1);
    fabricCanvasRef.current.setDimensions({
      width: editorData.canvasWidth,
      height: editorData.canvasHeight,
    });
    fabricCanvasRef.current.renderAll();
  };

  if (isLoading || !editorData) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* TOP TOOLBAR */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dm-creative")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="border-l h-8 border-gray-300" />
          <div>
            <h1 className="font-semibold">{editorData.campaignName || "Direct Mail Editor"}</h1>
            <p className="text-xs text-gray-500">
              {editorData.recipientName} {editorData.recipientLastname}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTemplateModal(true)}
            className="gap-2"
          >
            <Library className="w-4 h-4" />
            Save as Template
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Save className="w-4 h-4" />
            Save & Continue
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT TOOLBAR */}
        <div className="w-20 bg-gray-50 border-r flex flex-col items-center py-4 gap-3">
          <Button variant="ghost" size="sm" onClick={addText} className="w-14 h-14 flex flex-col p-0" title="Add Text">
            <Type className="w-6 h-6" />
            <span className="text-[10px] mt-1">Text</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={addRectangle} className="w-14 h-14 flex flex-col p-0" title="Add Rectangle">
            <Square className="w-6 h-6" />
            <span className="text-[10px] mt-1">Box</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={addCircle} className="w-14 h-14 flex flex-col p-0" title="Add Circle">
            <Circle className="w-6 h-6" />
            <span className="text-[10px] mt-1">Circle</span>
          </Button>
        </div>

        {/* CANVAS WORKSPACE */}
        <div className="flex-1 flex items-center justify-center overflow-auto bg-gradient-to-br from-gray-100 to-gray-200 p-8">
          <div
            className="bg-white shadow-2xl"
            style={{
              width: `${(editorData.canvasWidth * zoomLevel) / 100}px`,
              height: `${(editorData.canvasHeight * zoomLevel) / 100}px`,
            }}
          >
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>

      {/* BOTTOM BAR - Zoom Controls */}
      <div className="h-14 bg-white border-t flex items-center justify-between px-6">
        <div className="text-sm text-gray-600">
          {editorData.canvasWidth} × {editorData.canvasHeight}px
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 25}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="w-16 text-center">
            <span className="text-sm font-medium">{zoomLevel}%</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 200}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="border-l h-6 mx-2" />
          <Button variant="ghost" size="sm" onClick={handleZoomFit} className="gap-2">
            <Maximize2 className="w-4 h-4" />
            Fit
          </Button>
        </div>
        <div className="text-xs text-gray-500">Page 1 of 1</div>
      </div>

      {/* TEMPLATE SAVE MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Library className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Save as Reusable Template</h2>
                  <p className="text-sm text-gray-600">Create a template you can use for future campaigns</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplateModal(false)}
                disabled={isSavingTemplate}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Template Name */}
              <div>
                <Label htmlFor="template-name" className="text-sm font-medium">
                  Template Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="template-name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  placeholder="e.g., Spring Sale Postcard 2024"
                  className="mt-1.5"
                  disabled={isSavingTemplate}
                />
                <p className="text-xs text-gray-500 mt-1">Give your template a memorable name</p>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="template-category" className="text-sm font-medium">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={templateForm.category}
                  onValueChange={(value) => setTemplateForm({...templateForm, category: value})}
                  disabled={isSavingTemplate}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Helps organize templates in your library</p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="template-description" className="text-sm font-medium">
                  Description <span className="text-gray-400">(optional)</span>
                </Label>
                <Textarea
                  id="template-description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                  placeholder="Describe when and how to use this template..."
                  rows={3}
                  maxLength={500}
                  className="mt-1.5"
                  disabled={isSavingTemplate}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {templateForm.description.length}/500 characters
                </p>
              </div>

              {/* Optional Fields - Collapsed by default */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Additional Details <span className="text-gray-400">(optional)</span>
                </p>

                <div className="space-y-4">
                  {/* Target Audience */}
                  <div>
                    <Label htmlFor="target-audience" className="text-sm">
                      Target Audience
                    </Label>
                    <Input
                      id="target-audience"
                      value={templateForm.targetAudience}
                      onChange={(e) => setTemplateForm({...templateForm, targetAudience: e.target.value})}
                      placeholder="e.g., First-time customers 25-45, Homeowners"
                      className="mt-1.5"
                      disabled={isSavingTemplate}
                    />
                  </div>

                  {/* Tone */}
                  <div>
                    <Label htmlFor="tone" className="text-sm">
                      Tone & Style
                    </Label>
                    <Input
                      id="tone"
                      value={templateForm.tone}
                      onChange={(e) => setTemplateForm({...templateForm, tone: e.target.value})}
                      placeholder="e.g., Warm and reassuring, Professional, Urgent"
                      className="mt-1.5"
                      disabled={isSavingTemplate}
                    />
                  </div>

                  {/* Industry */}
                  <div>
                    <Label htmlFor="industry" className="text-sm">
                      Industry
                    </Label>
                    <Input
                      id="industry"
                      value={templateForm.industry}
                      onChange={(e) => setTemplateForm({...templateForm, industry: e.target.value})}
                      placeholder="e.g., Healthcare, Retail, Finance"
                      className="mt-1.5"
                      disabled={isSavingTemplate}
                    />
                  </div>
                </div>
              </div>

              {/* What Gets Saved Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">What's included in this template:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    Marketing message and copy
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    Complete design layout and styling
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    AI-generated background image (reusable)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    Variable fields for personalization (name, address, etc.)
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setShowTemplateModal(false)}
                disabled={isSavingTemplate}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAsTemplate}
                disabled={isSavingTemplate || !templateForm.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
              >
                {isSavingTemplate ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
