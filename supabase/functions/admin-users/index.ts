import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AdminUserPayload = {
  action: 'create' | 'update' | 'delete' | 'list' | 'sync_profile';
  id?: string;
  email?: string;
  password?: string;
  full_name?: string;
  username?: string;
  role?: 'admin' | 'colaborador';
  company?: 'Seven' | 'ARQO';
  status?: 'ativo' | 'inativo';
  avatar_url?: string | null;
};

type RequesterProfile = {
  role: 'admin' | 'colaborador';
  status: 'ativo' | 'inativo';
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
};

type AuditCategory = 'usuarios' | 'admins' | 'colaboradores' | 'conteudo' | 'midia' | 'certificados' | 'sistema';

function displayName(profile: RequesterProfile | null | undefined, fallback = 'Administrador') {
  return profile?.full_name || profile?.username || profile?.email || fallback;
}

function userCategory(role: unknown): AuditCategory {
  return role === 'admin' ? 'admins' : 'colaboradores';
}

async function insertAuditLog(
  adminClient: ReturnType<typeof createClient>,
  values: {
    actorId: string;
    actorName: string;
    category: AuditCategory;
    action: string;
    targetId?: string | null;
    targetType?: string | null;
    targetName?: string | null;
    company?: 'Seven' | 'ARQO' | null;
    message: string;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await adminClient
    .from('admin_audit_logs')
    .insert({
      actor_id: values.actorId,
      actor_name: values.actorName,
      category: values.category,
      action: values.action,
      target_id: values.targetId ?? null,
      target_type: values.targetType ?? null,
      target_name: values.targetName ?? null,
      company: values.company ?? null,
      message: values.message,
      metadata: values.metadata ?? {},
    });

  if (error) {
    console.warn('admin-users audit log failed', error.message);
  }
}

function profileFromAuthUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}) {
  const email = user.email?.trim().toLowerCase() ?? null;
  const role = user.app_metadata?.role === 'admin' ? 'admin' : 'colaborador';
  const company = user.app_metadata?.company === 'ARQO' ? 'ARQO' : 'Seven';
  const fullName = typeof user.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name
    : typeof user.user_metadata?.name === 'string'
      ? user.user_metadata.name
      : email?.split('@')[0] ?? 'Usuario';

  return {
    id: user.id,
    email,
    username: typeof user.user_metadata?.username === 'string'
      ? user.user_metadata.username
      : email?.split('@')[0] ?? 'usuario',
    full_name: fullName,
    role,
    company,
    status: 'ativo',
    avatar_url: typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Supabase environment variables are missing.');
    }

    const authHeader = request.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: requesterData, error: requesterError } = await userClient.auth.getUser();
    if (requesterError || !requesterData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role, status, full_name, username, email')
      .eq('id', requesterData.user.id)
      .single();

    const requesterProfile = profile as RequesterProfile | null;
    if (profileError || requesterProfile?.role !== 'admin' || requesterProfile?.status === 'inativo') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await request.json() as AdminUserPayload;
    if (!['create', 'update', 'delete', 'list', 'sync_profile'].includes(payload.action)) {
      return new Response(JSON.stringify({ error: 'Unsupported action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payload.action === 'list') {
      const { data: authUsers, error: listError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (listError) throw listError;

      const { data: profiles, error: profilesError } = await adminClient
        .from('profiles')
        .select('id, email, full_name, role, company, status, avatar_url');
      if (profilesError) throw profilesError;

      const profileById = new Map((profiles ?? []).map((item) => [item.id, item]));
      const users = authUsers.users.map((user) => {
        const profile = profileById.get(user.id);
        return {
          id: user.id,
          email: user.email ?? profile?.email ?? null,
          full_name: profile?.full_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          avatar_url: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
          role: profile?.role ?? user.app_metadata?.role ?? 'colaborador',
          company: profile?.company ?? user.app_metadata?.company ?? 'Seven',
          status: profile?.status ?? 'ativo',
          has_profile: Boolean(profile),
        };
      });

      return new Response(JSON.stringify({ users }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payload.action === 'sync_profile') {
      if (!payload.id) {
        return new Response(JSON.stringify({ error: 'User id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(payload.id);
      if (userError || !userData.user) throw userError ?? new Error('Auth user was not found.');

      const syncedProfile = profileFromAuthUser(userData.user);
      const { error: syncError } = await adminClient
        .from('profiles')
        .upsert(syncedProfile);

      if (syncError) throw syncError;

      await insertAuditLog(adminClient, {
        actorId: requesterData.user.id,
        actorName: displayName(requesterProfile),
        category: userCategory(syncedProfile.role),
        action: 'sync_profile',
        targetId: payload.id,
        targetType: 'profile',
        targetName: syncedProfile.full_name || syncedProfile.username || syncedProfile.email || payload.id,
        company: syncedProfile.company,
        message: `${displayName(requesterProfile)} sincronizou o perfil de ${syncedProfile.full_name || syncedProfile.username || syncedProfile.email || 'um usuario'}.`,
        metadata: { role: syncedProfile.role, email: syncedProfile.email },
      });

      return new Response(JSON.stringify({ id: payload.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payload.action === 'delete') {
      if (!payload.id) {
        return new Response(JSON.stringify({ error: 'User id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (payload.id === requesterData.user.id) {
        return new Response(JSON.stringify({ error: 'You cannot delete your own user.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: deletedProfile } = await adminClient
        .from('profiles')
        .select('id, email, username, full_name, role, company, status, avatar_url')
        .eq('id', payload.id)
        .maybeSingle();
      const deletedUserName = deletedProfile?.full_name || deletedProfile?.username || deletedProfile?.email || 'um usuario';
      const deletedRole = deletedProfile?.role ?? 'colaborador';
      const deletedCompany = deletedProfile?.company === 'ARQO' ? 'ARQO' : 'Seven';

      const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(payload.id);
      if (deleteUserError) throw deleteUserError;

      const { error: deleteProfileError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', payload.id);
      if (deleteProfileError) throw deleteProfileError;

      await insertAuditLog(adminClient, {
        actorId: requesterData.user.id,
        actorName: displayName(requesterProfile),
        category: userCategory(deletedRole),
        action: 'delete_user',
        targetId: payload.id,
        targetType: 'profile',
        targetName: deletedUserName,
        company: deletedCompany,
        message: `${displayName(requesterProfile)} excluiu ${deletedRole === 'admin' ? 'um administrador' : `o(a) colaborador(a) ${deletedUserName}`}.`,
        metadata: { role: deletedRole, email: deletedProfile?.email ?? null },
      });

      return new Response(JSON.stringify({ id: payload.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const auditAction = payload.action;
    let previousProfile: Record<string, unknown> | null = null;

    if (payload.action === 'update' && payload.id) {
      const { data } = await adminClient
        .from('profiles')
        .select('id, email, username, full_name, role, company, status, avatar_url')
        .eq('id', payload.id)
        .maybeSingle();
      previousProfile = data;
    }

    if (payload.action === 'create') {
      if (!payload.email || !payload.password) {
        return new Response(JSON.stringify({ error: 'Password is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          full_name: payload.full_name ?? payload.email.split('@')[0],
          username: payload.username ?? payload.email.split('@')[0],
          avatar_url: payload.avatar_url ?? null,
        },
        app_metadata: {
          role: payload.role ?? 'colaborador',
          company: payload.company ?? 'Seven',
        },
      });

      if (createError || !createdUser.user) {
        throw createError ?? new Error('User was not created.');
      }

      payload.id = createdUser.user.id;
    } else {
      if (!payload.id || !payload.email) {
        return new Response(JSON.stringify({ error: 'User id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authUpdate: {
        email: string;
        password?: string;
        user_metadata: Record<string, string>;
        app_metadata: Record<string, string>;
      } = {
        email: payload.email.trim().toLowerCase(),
        user_metadata: {
          full_name: payload.full_name ?? payload.email.split('@')[0],
          username: payload.username ?? payload.email.split('@')[0],
          avatar_url: payload.avatar_url ?? null,
        },
        app_metadata: { role: payload.role ?? 'colaborador', company: payload.company ?? 'Seven' },
      };

      if (payload.password) {
        authUpdate.password = payload.password;
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(payload.id, authUpdate);
      if (updateError) throw updateError;
    }

    if (!payload.email) {
      throw new Error('Email is required.');
    }

    const { error: profileUpsertError } = await adminClient
      .from('profiles')
      .upsert({
        id: payload.id,
        email: payload.email.trim().toLowerCase(),
        username: payload.username || payload.email.split('@')[0],
        full_name: payload.full_name ?? payload.email.split('@')[0],
        role: payload.role ?? 'colaborador',
        company: payload.company ?? 'Seven',
        status: payload.status ?? 'ativo',
        avatar_url: payload.avatar_url ?? null,
      });

    if (profileUpsertError) throw profileUpsertError;

    const targetName = payload.full_name || payload.username || payload.email || 'um usuario';
    const targetRole = payload.role ?? 'colaborador';
    const targetCompany = payload.company ?? 'Seven';
    await insertAuditLog(adminClient, {
      actorId: requesterData.user.id,
      actorName: displayName(requesterProfile),
      category: userCategory(targetRole),
      action: auditAction === 'create' ? 'create_user' : 'update_user',
      targetId: payload.id,
      targetType: 'profile',
      targetName,
      company: targetCompany,
      message: auditAction === 'create'
        ? `${displayName(requesterProfile)} criou um ${targetRole === 'admin' ? 'administrador' : 'usuario'} para empresa ${targetCompany}.`
        : `${displayName(requesterProfile)} atualizou o cadastro de ${targetName}.`,
      metadata: {
        role: targetRole,
        email: payload.email,
        previous_role: previousProfile?.role ?? null,
        previous_company: previousProfile?.company ?? null,
        status: payload.status ?? 'ativo',
      },
    });

    return new Response(JSON.stringify({ id: payload.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
