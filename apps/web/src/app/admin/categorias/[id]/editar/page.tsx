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
import type { Categoria, UpdateCategoriaInput } from '@/lib/api/types';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CategoriaFormData {
  nome: string;
  slug: string;
  descricao?: string;
  imagem_url?: string;
  pai_id?: string;
  ordem_exibicao?: number;
  ativa?: boolean;
}

export default function AdminEditarCategoriaPage() {
  const router = useRouter();
  const params = useParams();
  const categoriaId = params.id as string;

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CategoriaFormData>({
    nome: '',
    slug: '',
    descricao: '',
    imagem_url: '',
    pai_id: '',
    ordem_exibicao: 0,
    ativa: true,
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    if (categoriaId) {
      fetchCategoria();
    }
  }, [categoriaId]);

  const fetchCategorias = async () => {
    try {
      const data = await api.get<{ data: Categoria[] }>('/categorias?ativa=true&limit=100');
      setCategorias(data.data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const fetchCategoria = async () => {
    setLoading(true);
    try {
      const data = await adminApi.categorias.getById(categoriaId);
      setFormData({
        nome: data.nome,
        slug: data.slug,
        descricao: data.descricao || '',
        imagem_url: data.imagem_url || '',
        pai_id: data.pai_id || '',
        ordem_exibicao: data.ordem_exibicao || 0,
        ativa: data.ativa,
      });
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      setError('Erro ao carregar categoria');
    } finally {
      setLoading(false);
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
      await adminApi.categorias.update(categoriaId, formData as UpdateCategoriaInput);
      router.push('/admin/categorias');
      router.refresh();
    } catch (err) {
      setError(
        (err as { data?: { error?: string } })?.data?.error ?? 'Erro ao atualizar categoria'
      );
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
        <Link href="/admin/categorias" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Categoria</h1>
          <p className="text-muted-foreground">Atualize as informações da categoria</p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-600 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados principais da categoria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Categoria *</Label>
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
                  placeholder="Ex: Roupas, Eletrônicos, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  required
                  placeholder="roupas"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                placeholder="Descrição da categoria (opcional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagem_url">URL da Imagem</Label>
              <Input
                id="imagem_url"
                value={formData.imagem_url}
                onChange={(e) => handleChange('imagem_url', e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="pai_id">Categoria Pai</Label>
                <Select
                  value={formData.pai_id || ''}
                  onValueChange={(v) => handleChange('pai_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria pai (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma (categoria raiz)</SelectItem>
                    {categorias
                      .filter((cat) => cat.id !== categoriaId)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordem_exibicao">Ordem de Exibição</Label>
                <Input
                  id="ordem_exibicao"
                  type="number"
                  value={formData.ordem_exibicao || ''}
                  onChange={(e) =>
                    handleChange('ordem_exibicao', Number.parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>Opções de exibição</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Ativa</Label>
                <p className="text-sm text-muted-foreground">Categoria visível na loja</p>
              </div>
              <Switch
                checked={formData.ativa ?? true}
                onCheckedChange={(checked) => handleChange('ativa', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/admin/categorias">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Salvando...' : 'Atualizar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
