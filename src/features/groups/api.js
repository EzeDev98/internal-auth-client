// API calls for groups and sub-groups.
import { z } from 'zod';
import { bffGet, bffPost, bffPatch, bffDelete } from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import { groupSummarySchema, subGroupSummarySchema, groupDetailSchema } from './groupResponseSchemas';

export function listGroups() {
  return bffGet('/groups').then((data) => parseResponse(z.array(groupSummarySchema), data));
}

export function listSubgroups(id) {
  return bffGet(`/groups/${encodeURIComponent(id)}/subgroups`)
    .then((data) => parseResponse(z.array(subGroupSummarySchema), data));
}

export function getGroup(groupName) {
  return bffGet(`/groups/${encodeURIComponent(groupName)}`)
    .then((data) => parseResponse(groupDetailSchema, data));
}

export function createGroup(payload) {
  return bffPost('/groups', payload);
}

export function createSubgroup(parentGroupName, payload) {
  return bffPost(`/groups/${encodeURIComponent(parentGroupName)}/subgroups`, payload);
}

export function assignRoleToGroup(groupName, payload) {
  return bffPost(`/groups/${encodeURIComponent(groupName)}/roles`, payload);
}

export function assignRoleToSubgroup(parentGroupName, subGroupName, payload) {
  return bffPost(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}/roles`,
    payload,
  );
}

export function renameSubgroup(parentGroupName, subGroupName, payload) {
  return bffPatch(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}`,
    payload,
  );
}

export function moveSubgroup(parentGroupName, subGroupName, payload) {
  return bffPatch(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}/move`,
    payload,
  );
}

export function deleteSubgroup(parentGroupName, subGroupName) {
  return bffDelete(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}`,
  );
}

export function addGroupMember(groupName, payload) {
  return bffPost(`/groups/${encodeURIComponent(groupName)}/users`, payload);
}

export function removeGroupMember(groupName, username) {
  return bffDelete(`/groups/${encodeURIComponent(groupName)}/users/${encodeURIComponent(username)}`);
}
