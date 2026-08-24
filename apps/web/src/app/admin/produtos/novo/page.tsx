'use client';

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
import type { Categoria, CreateProdutoInput } from '@/lib/api/types';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function AdminNovoProdutoPage() {
  const router = useRouter();

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

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const data = await api.get<{ data: Categoria[] }>('/categorias?ativa=true&limit=100');
      setCategorias(data.data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loja_id = 'default-loja-id'; // TODO: get from auth context
      await adminApi.produtos.create({ ...formData, loja_id } as CreateProdutoInput);
      router.push('/admin/produtos');
      router.refresh();
    } catch (err: any) {
      setError(err.data?.error || 'Erro ao criar produto');
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
          <h1 className="text-3xl font-bold tracking-tight">Novo Produto</h1>
          <p className="text-muted-foreground">Cadastre um novo produto no catálogo</p>
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
            {submitting ? 'Criando...' : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </div>
  );
}
