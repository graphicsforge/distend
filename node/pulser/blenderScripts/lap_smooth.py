
import bpy
import os
from mathutils import *


base_filename = os.environ['basestl']
output_filename = os.environ['outputstl']
json = os.environ['json']
factor = float(os.environ['factor'])

print('status 2%')
bpy.ops.import_mesh.stl(filepath=base_filename)
model=bpy.data.objects[0]
bpy.ops.object.select_all(action='DESELECT')
bpy.context.scene.objects.active=model
mod = bpy.ops.object.modifier_add(type='LAPLACIANSMOOTH')
model.modifiers[0].iterations = 1
model.modifiers[0].lambda_factor = factor
#bpy.ops.object.modifier_apply(apply_as='DATA', modifier=model.modifiers[0].name)
print('status 20%')
model.select=True
bpy.ops.export_mesh.stl(filepath=output_filename)
print('status 30%')
# export json
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.sphere_project(direction='VIEW_ON_EQUATOR', align='POLAR_ZX', correct_aspect=True, clip_to_bounds=True, scale_to_bounds=False)
#bpy.ops.uv.smart_project(angle_limit=66)
print('status 40%')
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.export_mesh.vajson(filepath=json)

