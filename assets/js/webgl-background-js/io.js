// Parse OBJ file format for WebGL rendering
// It returns vec3 objects with positions, texture coordinates, and normals
// It also returns a list of indices for the faces
function parseOBJ(text, separate_faces = false) {
  const positions = [];
  const texcoords = [];
  const normals = [];
  const positionIndices = [];
  const texcoordIndices = [];
  const normalIndices = [];

  const lines = text.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#') || line === '') continue;
    const parts = line.split(/\s+/);
    switch (parts[0]) {
      case 'v':
        positions.push(parts.slice(1).map(Number));
        break;
      case 'vt':
        texcoords.push(parts.slice(1).map(Number));
        break;
      case 'vn':
        normals.push(parts.slice(1).map(Number));
        break;
      case 'f':
        for (let i = 1; i < parts.length; ++i) {
          const vals = parts[i].split('/');
          positionIndices.push(parseInt(vals[0], 10) - 1);
          if (vals[1]) texcoordIndices.push(parseInt(vals[1], 10) - 1);
          if (vals[2]) normalIndices.push(parseInt(vals[2], 10) - 1);
        }
        break;
    }
  }

  if (separate_faces) {
    const outPositions = [];
    const outTexcoords = [];
    const outNormals = [];
    const indices = [];

    for (let i = 0; i < positionIndices.length; ++i) {
      outPositions.push(positions[positionIndices[i]]);
      if (texcoordIndices.length) outTexcoords.push(texcoords[texcoordIndices[i]]);
      if (normalIndices.length) outNormals.push(normals[normalIndices[i]]);
      indices.push(i);
    }

    return {
      positions: outPositions.flat(),
      texcoords: outTexcoords.flat(),
      normals: outNormals.flat(),
      indices: indices
    };
  
  } else {

    return {
      positions: positions.flat(),
      texcoords: texcoords.flat(),
      normals: normals.flat(),
      indices: positionIndices
    };

  }

}

export {parseOBJ}
