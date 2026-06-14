from __future__ import annotations

from typing import Any


def _normalize_name(value: str) -> str:
    return value.strip().lower()


def compute_critical_path_phases(
    dependencies: list[Any], phase_names: list[str] | None = None
) -> list[str]:
    """Return phase/task names on the longest dependency chain."""
    if not dependencies:
        return []

    graph: dict[str, list[str]] = {}
    in_degree: dict[str, int] = {}
    nodes: set[str] = set()

    for dep in dependencies:
        if not isinstance(dep, dict):
            continue
        pred = dep.get("predecessor") or dep.get("from") or dep.get("predecessor_name")
        succ = dep.get("successor") or dep.get("to") or dep.get("successor_name")
        if not pred or not succ:
            continue
        pred_s, succ_s = str(pred), str(succ)
        nodes.add(pred_s)
        nodes.add(succ_s)
        graph.setdefault(pred_s, []).append(succ_s)
        in_degree.setdefault(pred_s, in_degree.get(pred_s, 0))
        in_degree[succ_s] = in_degree.get(succ_s, 0) + 1

    if phase_names:
        for name in phase_names:
            if name:
                nodes.add(str(name))
                in_degree.setdefault(str(name), in_degree.get(str(name), 0))

    if not nodes:
        return []

    # Topological DP for longest path
    dist: dict[str, int] = {n: 0 for n in nodes}
    parent: dict[str, str | None] = {n: None for n in nodes}
    queue = [n for n in nodes if in_degree.get(n, 0) == 0]

    visited_order: list[str] = []
    while queue:
        node = queue.pop(0)
        visited_order.append(node)
        for neighbor in graph.get(node, []):
            candidate = dist[node] + 1
            if candidate > dist.get(neighbor, 0):
                dist[neighbor] = candidate
                parent[neighbor] = node
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if not dist:
        return []

    end_node = max(dist, key=lambda k: dist[k])
    if dist[end_node] == 0 and len(nodes) == 1:
        return [end_node]
    if dist[end_node] == 0:
        return []

    path: list[str] = []
    current: str | None = end_node
    while current is not None:
        path.append(current)
        current = parent.get(current)
    path.reverse()
    return path


def mark_critical_phases(
    phases: list[dict[str, Any]], critical_names: list[str]
) -> list[dict[str, Any]]:
    if not critical_names:
        return phases
    critical_set = {_normalize_name(n) for n in critical_names}
    result: list[dict[str, Any]] = []
    for phase in phases:
        name = phase.get("name") or ""
        updated = dict(phase)
        updated["isCritical"] = _normalize_name(str(name)) in critical_set
        result.append(updated)
    return result
