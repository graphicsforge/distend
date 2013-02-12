
import bpy
import os
from mathutils import *


base_filename = os.environ['basestl']
output_filename = os.environ['outputstl']
json = os.environ['json']
octree = float(os.environ['octree'])

print('deforming')
bpy.ops.import_mesh.stl(filepath=base_filename)
model=bpy.data.objects[0]
bpy.ops.object.select_all(action='DESELECT')
bpy.context.scene.objects.active=model
mod = bpy.ops.object.modifier_add(type='REMESH')
model.modifiers[0].mode = os.environ['mode']
model.modifiers[0].octree_depth = octree
bpy.ops.object.modifier_apply(apply_as='DATA', modifier=model.modifiers[0].name)
print('status 20%')
model.select=True
bpy.ops.export_mesh.stl(filepath=output_filename)
print('status 30%')
# export json
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.sphere_project(direction='VIEW_ON_EQUATOR', align='POLAR_ZX', correct_aspect=True, clip_to_bounds=True, scale_to_bounds=False)
print('status 60%')
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.export_mesh.vajson(filepath=json)

