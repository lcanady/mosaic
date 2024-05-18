export class Graph<T> {
  private _adjList: Map<T, Set<T>>;

  constructor() {
    this._adjList = new Map<T, Set<T>>();
  }

  addVert(v: T) {
    if (!this._adjList.has(v)) {
      this._adjList.set(v, new Set());
    }
    return this;
  }

  addEdge(v: T, w: T) {
    if (!this._adjList.has(v)) {
      this.addVert(v);
    }
    if (!this._adjList.has(w)) {
      this.addVert(w);
    }
    this._adjList.get(v)?.add(w);
    this._adjList.get(w)?.add(v); // Assuming undirected graph
    return this;
  }

  removeVert(v: T) {
    if (this._adjList.has(v)) {
      // Remove the vertex from all adjacency lists
      for (let [key, neighbors] of this._adjList) {
        if (neighbors.has(v)) {
          neighbors.delete(v);
        }
      }
      // Finally, remove the vertex's own adjacency list
      this._adjList.delete(v);
    }
    return this;
  }

  removeEdge(v: T, w: T) {
    if (this._adjList.has(v)) {
      this._adjList.get(v)?.delete(w);
    }
    if (this._adjList.has(w)) {
      this._adjList.get(w)?.delete(v); // Assuming undirected graph
    }
    return this;
  }

  clear() {
    this._adjList.clear();
  }

  hasVert(v: T) {
    return this._adjList.has(v);
  }

  linked(v: T, w: T) {
    return this._adjList.get(v)?.has(w);
  }

  get size() {
    return this._adjList.size;
  }

  bfs(start: T, end: T): T[] {
    if (!this.hasVert(start) || !this.hasVert(end)) return [];

    const visited = new Set<T>();
    const queue = [start];
    const predecessor = new Map<T, T>();
    let path: T[] = [];

    visited.add(start);

    while (queue.length > 0) {
      let vert = queue.shift()!;

      if (vert === end) {
        // Build path by walking backwards from the end
        while (vert !== undefined) {
          path.push(vert);
          vert = predecessor.get(vert)!;
        }
        path.reverse();
        return path;
      }

      this._adjList.get(vert)?.forEach((link) => {
        if (!visited.has(link)) {
          visited.add(link);
          predecessor.set(link, vert);
          queue.push(link);
        }
      });
    }

    return path; // Return empty if no path found
  }

  dfs(start: T, end: T): T[] {
    if (!this.hasVert(start) || !this.hasVert(end)) return [];

    const visited = new Set<T>();
    const stack: T[] = [start];
    let path: T[] = [];

    while (stack.length > 0) {
      const vertex = stack.pop();

      if (!visited.has(vertex!)) {
        visited.add(vertex!);
        if (vertex === end) {
          path = Array.from(visited);
          break;
        }
        this._adjList.get(vertex!)?.forEach((v) => {
          stack.push(v);
        });
      }
    }
    return path; // Return path or empty if no path is found
  }
}

export const graph = new Graph<string>();
