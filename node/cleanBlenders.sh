ps -ef | grep blender | grep $1 | cut -d ' ' -f4 | xargs kill
