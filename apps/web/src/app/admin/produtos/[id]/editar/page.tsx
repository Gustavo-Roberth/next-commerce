'use client';

import { ImageUpload } from '@/components/admin/ImageUpload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import { adminApi } from '@/lib/api/services';
import type {
  Categoria,
  CreateProdutoInput,
  ProdutoAtributo,
  ProdutoVariacao,
  UpdateProdutoInput,
} from '@/lib/api/types';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ProdutoFormData extends Partial<CreateProdutoInput> {
  nome: string;
  slug: string;
  sku: string;
  categoria_id: string;
  descricao_curta?: string;
  descricao_completa?: string;
  codigo_barras?: string;
  ncm?: string;
  cest?: string;
  origem_mercadoria?: number;
  peso_bruto_kg?: number;
  peso_liquido_kg?: number;
  ativo?: boolean;
  destaque?: boolean;
  permite_avaliacao?: boolean;
  meta_title?: string;
  meta_description?: string;
  status?: string;
}

export default function AdminProdutoEditarPage() {
  const router = useRouter();
  const params = useParams();
  const isEditing = !!params.id;
  const produtoId = params.id as string;

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<ProdutoFormData>({
    nome: '',
    slug: '',
    sku: '',
    categoria_id: '',
    descricao_curta: '',
    descricao_completa: '',
    codigo_barras: '',
    ncm: '',
    cest: '',
    origem_mercadoria: 0,
    peso_bruto_kg: 0,
    peso_liquido_kg: 0,
    ativo: true,
    destaque: false,
    permite_avaliacao: true,
    meta_title: '',
    meta_description: '',
    status: 'RASCUNHO',
  });

  const [variacoes, setVariacoes] = useState<ProdutoVariacao[]>([]);
  const [atributos, setAtributos] = useState<ProdutoAtributo[]>([]);
  const [editingVariacao, setEditingVariacao] = useState<ProdutoVariacao | null>(null);
  const [variacaoForm, setVariacaoForm] = useState<{
    sku: string;
    nome: string;
    preco_cents: number;
    ativo: boolean;
    atributos: Record<string, string>;
  }>({
    sku: '',
    nome: '',
    preco_cents: 0,
    ativo: true,
    atributos: {} as Record<string, string>,
  });
  const [variacaoFormError, setVariacaoFormError] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const fetchCategorias = useCallback(async () => {
    try {
      const data = await api.get<{ data: Categoria[] }>('/categorias?ativa=true&limit=100');
      setCategorias(data.data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  }, []);

  const fetchProduto = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.produtos.getById(produtoId);
      setFormData({
        nome: data.nome,
        slug: data.slug,
        sku: data.sku,
        categoria_id: data.categoria_id,
        descricao_curta: data.descricao_completa || '',
        descricao_completa: data.descricao_completa || '',
        codigo_barras: data.codigo_barras || '',
        ncm: data.ncm || '',
        cest: data.cest || '',
        origem_mercadoria: data.origem_mercadoria || 0,
        peso_bruto_kg: data.peso_bruto_kg || 0,
        peso_liquido_kg: data.peso_liquido_kg || 0,
        ativo: data.ativo,
        destaque: data.destaque,
        permite_avaliacao: data.permite_avaliacao,
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        status: data.status,
      });
      if (data.variacoes) {
        setVariacoes(data.variacoes);
      }
      if (data.variacoes?.[0]?.atributos) {
        // Extract unique attributes from variations
        const attrMap = new Map<string, ProdutoAtributo>();
        for (const v of data.variacoes ?? []) {
          for (const a of v.atributos ?? []) {
            if (!attrMap.has(a.atributo_id)) {
              attrMap.set(a.atributo_id, {
                atributo_id: a.atributo_id,
                nome: a.nome,
                valores: [a.valor],
              });
            } else {
              const existing = attrMap.get(a.atributo_id);
              if (existing && !existing.valores.includes(a.valor)) {
                existing.valores.push(a.valor);
              }
            }
          }
        }
        setAtributos(Array.from(attrMap.values()));
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      setError('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  }, [produtoId]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  useEffect(() => {
    if (isEditing) {
      fetchProduto();
    }
  }, [isEditing, fetchProduto]);

  const handleVariacaoDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeVariacaoForm();
      return;
    }
    if (e.key === 'Tab' && dialogRef.current) {
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  // Variation management functions
  const openVariacaoForm = (variacao?: ProdutoVariacao) => {
    if (variacao) {
      const attrs: Record<string, string> = {};
      for (const a of variacao.atributos ?? []) {
        attrs[a.atributo_id] = a.valor;
      }
      setEditingVariacao(variacao);
      setVariacaoForm({
        sku: variacao.sku,
        nome: variacao.nome,
        preco_cents: variacao.preco_cents || 0,
        ativo: variacao.ativo,
        atributos: attrs,
      });
    } else {
      setEditingVariacao(null);
      setVariacaoForm({
        sku: '',
        nome: '',
        preco_cents: 0,
        ativo: true,
        atributos: {},
      });
    }
    setVariacaoFormError('');
  };

  const closeVariacaoForm = useCallback(() => {
    setEditingVariacao(null);
    setVariacaoForm({ sku: '', nome: '', preco_cents: 0, ativo: true, atributos: {} });
    setVariacaoFormError('');
  }, []);

  useEffect(() => {
    if (editingVariacao === null) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLButtonElement>('[data-variacao-close]')?.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      previousFocusRef.current?.focus();
    };
  }, [editingVariacao]);

  const saveVariacao = async () => {
    setVariacaoFormError('');
    if (!variacaoForm.sku || !variacaoForm.nome) {
      setVariacaoFormError('SKU e Nome são obrigatórios');
      return;
    }
    if (variacaoForm.preco_cents === undefined || variacaoForm.preco_cents <= 0) {
      setVariacaoFormError('Preço deve ser maior que zero');
      return;
    }

    try {
      if (editingVariacao) {
        // Update existing variation
        await api.put(`/admin/produtos/${produtoId}/variacoes/${editingVariacao.id}`, variacaoForm);
      } else {
        // Create new variation
        await api.post(`/admin/produtos/${produtoId}/variacoes`, variacaoForm);
      }
      closeVariacaoForm();
      // Refresh product data
      const data = await adminApi.produtos.getById(produtoId);
      if (data.variacoes) {
        setVariacoes(data.variacoes);
      }
    } catch (err) {
      setVariacaoFormError(
        (err as { data?: { error?: string } })?.data?.error ?? 'Erro ao salvar variação'
      );
    }
  };

  const deleteVariacao = async (variacaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta variação?')) return;
    try {
      await api.delete(`/admin/produtos/${produtoId}/variacoes/${variacaoId}`);
      setVariacoes((prev) => prev.filter((v) => v.id !== variacaoId));
    } catch (error) {
      console.error('Erro ao excluir variação:', error);
      alert('Erro ao excluir variação');
    }
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }) as typeof formData);
  };

  const generateSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isEditing) {
        await adminApi.produtos.update(produtoId, formData as UpdateProdutoInput);
      }
      router.push('/admin/produtos');
      router.refresh();
    } catch (err) {
      setError((err as { data?: { error?: string } })?.data?.error ?? 'Erro ao salvar produto');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/produtos" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? 'Atualize as informações do produto'
              : 'Cadastre um novo produto no catálogo'}
          </p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-600 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados principais do produto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleChange('nome', value);
                    if (!formData.slug || formData.slug === generateSlug(formData.nome)) {
                      handleChange('slug', generateSlug(value));
                    }
                  }}
                  required
                  placeholder="Ex: Camiseta Básica Preta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  required
                  placeholder="camiseta-basica-preta"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                  required
                  placeholder="CAM-001-PRETA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo_barras">Código de Barras (EAN/GTIN)</Label>
                <Input
                  id="codigo_barras"
                  value={formData.codigo_barras}
                  onChange={(e) => handleChange('codigo_barras', e.target.value)}
                  placeholder="7891234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria_id">Categoria *</Label>
                <Select
                  value={formData.categoria_id}
                  onValueChange={(v) => handleChange('categoria_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao_curta">Descrição Curta</Label>
              <Textarea
                id="descricao_curta"
                value={formData.descricao_curta}
                onChange={(e) => handleChange('descricao_curta', e.target.value)}
                placeholder="Descrição breve para listagens (máx. 500 caracteres)"
                maxLength={500}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao_completa">Descrição Completa</Label>
              <Textarea
                id="descricao_completa"
                value={formData.descricao_completa}
                onChange={(e) => handleChange('descricao_completa', e.target.value)}
                placeholder="Descrição detalhada do produto (HTML suportado)"
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados Fiscais e Logísticos</CardTitle>
            <CardDescription>Informações para nota fiscal e envio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ncm">NCM</Label>
                <Input
                  id="ncm"
                  value={formData.ncm}
                  onChange={(e) => handleChange('ncm', e.target.value)}
                  placeholder="61091000"
                  maxLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cest">CEST</Label>
                <Input
                  id="cest"
                  value={formData.cest}
                  onChange={(e) => handleChange('cest', e.target.value)}
                  placeholder="2803800"
                  maxLength={7}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origem_mercadoria">Origem da Mercadoria</Label>
                <Select
                  value={String(formData.origem_mercadoria)}
                  onValueChange={(v) => handleChange('origem_mercadoria', Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Nacional</SelectItem>
                    <SelectItem value="1">1 - Estrangeira - Importação direta</SelectItem>
                    <SelectItem value="2">
                      2 - Estrangeira - Adquirida no mercado interno
                    </SelectItem>
                    <SelectItem value="3">
                      3 - Nacional - Conteúdo importação maior que 40%
                    </SelectItem>
                    <SelectItem value="4">
                      4 - Nacional - Conteúdo importação menor ou igual a 40%
                    </SelectItem>
                    <SelectItem value="5">
                      5 - Nacional - Conteúdo importação maior que 70%
                    </SelectItem>
                    <SelectItem value="6">
                      6 - Nacional - Conteúdo importação menor ou igual a 70%
                    </SelectItem>
                    <SelectItem value="7">7 - Nacional - Sem similar nacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="peso_bruto_kg">Peso Bruto (kg)</Label>
                <Input
                  id="peso_bruto_kg"
                  type="number"
                  step="0.001"
                  value={formData.peso_bruto_kg || ''}
                  onChange={(e) =>
                    handleChange('peso_bruto_kg', Number.parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="peso_liquido_kg">Peso Líquido (kg)</Label>
                <Input
                  id="peso_liquido_kg"
                  type="number"
                  step="0.001"
                  value={formData.peso_liquido_kg || ''}
                  onChange={(e) =>
                    handleChange('peso_liquido_kg', Number.parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.450"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altura">Altura (cm)</Label>
                <Input
                  id="altura"
                  type="number"
                  step="0.1"
                  value={formData.dimensoes_cm?.altura || ''}
                  onChange={(e) =>
                    handleChange('dimensoes_cm', {
                      ...formData.dimensoes_cm,
                      altura: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="largura">Largura (cm)</Label>
                <Input
                  id="largura"
                  type="number"
                  step="0.1"
                  value={formData.dimensoes_cm?.largura || ''}
                  onChange={(e) =>
                    handleChange('dimensoes_cm', {
                      ...formData.dimensoes_cm,
                      largura: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="20"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="comprimento">Comprimento (cm)</Label>
                <Input
                  id="comprimento"
                  type="number"
                  step="0.1"
                  value={formData.dimensoes_cm?.comprimento || ''}
                  onChange={(e) =>
                    handleChange('dimensoes_cm', {
                      ...formData.dimensoes_cm,
                      comprimento: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="30"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Imagens do Produto */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Imagens do Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                productId={produtoId}
                multiple
                maxFiles={10}
                label="Imagens do Produto"
              />
            </CardContent>
          </Card>
        )}

        {/* Variações do Produto */}
        {isEditing && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Variações do Produto
              </CardTitle>
              <Button onClick={() => openVariacaoForm()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Variação
              </Button>
            </CardHeader>
            <CardContent>
              {variacoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma variação cadastrada</p>
                  <p className="text-sm">Clique em "Nova Variação" para adicionar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variacoes.map((variacao) => (
                    <div
                      key={variacao.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                          {variacao.imagens?.[0] ? (
                            <img
                              src={variacao.imagens[0].url}
                              alt={variacao.nome}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Tag className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{variacao.nome}</p>
                          <p className="text-sm text-muted-foreground">SKU: {variacao.sku}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{formatCurrency((variacao.preco_cents || 0) / 100)}</span>
                            <Badge
                              className={
                                variacao.ativo
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {variacao.ativo ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          {variacao.atributos && variacao.atributos.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {variacao.atributos.map((a) => (
                                <Badge key={a.atributo_id} variant="secondary" className="text-xs">
                                  {a.nome}: {a.valor}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openVariacaoForm(variacao)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteVariacao(variacao.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal de Variação */}
        {editingVariacao !== null && (
          <div
            // biome-ignore lint/a11y/useSemanticElements: modal kept as a div overlay with manual focus and escape handling
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="variacao-dialog-title"
            ref={dialogRef}
            onKeyDown={handleVariacaoDialogKeyDown}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 id="variacao-dialog-title" className="text-lg font-semibold">
                    {editingVariacao ? 'Editar Variação' : 'Nova Variação'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeVariacaoForm}
                    data-variacao-close
                    aria-label="Fechar"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveVariacao();
                }}
                className="p-6 space-y-4"
              >
                {variacaoFormError && (
                  <div className="rounded-lg bg-red-50 p-3 text-red-600 text-sm">
                    {variacaoFormError}
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="var_sku">SKU *</Label>
                    <Input
                      id="var_sku"
                      value={variacaoForm.sku}
                      onChange={(e) =>
                        setVariacaoForm((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))
                      }
                      placeholder="CAM-001-PRETA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="var_nome">Nome *</Label>
                    <Input
                      id="var_nome"
                      value={variacaoForm.nome}
                      onChange={(e) =>
                        setVariacaoForm((prev) => ({ ...prev, nome: e.target.value }))
                      }
                      placeholder="Ex: Vermelho / GG"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="var_preco">Preço (centavos) *</Label>
                  <Input
                    id="var_preco"
                    type="number"
                    value={variacaoForm.preco_cents}
                    onChange={(e) =>
                      setVariacaoForm((prev) => ({
                        ...prev,
                        preco_cents: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="9990"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Atributos</Label>
                  <div className="space-y-2">
                    {atributos.map((attr) => (
                      <div key={attr.atributo_id} className="space-y-1">
                        <Label htmlFor={`attr_${attr.atributo_id}`}>{attr.nome}</Label>
                        <Select
                          value={variacaoForm.atributos[attr.atributo_id] || ''}
                          onValueChange={(v) =>
                            setVariacaoForm((prev) => ({
                              ...prev,
                              atributos: { ...prev.atributos, [attr.atributo_id]: v },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Selecione ${attr.nome}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {attr.valores.map((valor) => (
                              <SelectItem key={valor} value={valor}>
                                {valor}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="var_ativo"
                      checked={variacaoForm.ativo}
                      onChange={(e) =>
                        setVariacaoForm((prev) => ({ ...prev, ativo: e.target.checked }))
                      }
                    />
                    <Label htmlFor="var_ativo">Ativa</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={closeVariacaoForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingVariacao ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>Opções de exibição e SEO</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Ativo</Label>
                  <p className="text-sm text-muted-foreground">Produto visível na loja</p>
                </div>
                <Switch
                  checked={formData.ativo ?? true}
                  onCheckedChange={(checked) => handleChange('ativo', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Destaque na Home</Label>
                  <p className="text-sm text-muted-foreground">Exibir na página inicial</p>
                </div>
                <Switch
                  checked={formData.destaque ?? false}
                  onCheckedChange={(checked) => handleChange('destaque', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Permite Avaliação</Label>
                  <p className="text-sm text-muted-foreground">Clientes podem avaliar</p>
                </div>
                <Switch
                  checked={formData.permite_avaliacao ?? true}
                  onCheckedChange={(checked) => handleChange('permite_avaliacao', checked)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'RASCUNHO'}
                  onValueChange={(v) => handleChange('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                    <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title (SEO)</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => handleChange('meta_title', e.target.value)}
                  placeholder="Título para buscadores (máx. 60 caracteres)"
                  maxLength={60}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description (SEO)</Label>
                <Input
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => handleChange('meta_description', e.target.value)}
                  placeholder="Descrição para buscadores (máx. 160 caracteres)"
                  maxLength={160}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/admin/produtos">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </div>
  );
}
