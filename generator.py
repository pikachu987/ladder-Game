import os, requests, json

root_path = os.path.dirname(os.path.realpath(__file__))
folder_path = root_path + '/js'
file_suffix = '.js'
file_seperator = '\n'
sum_file_path = 'ladder.js'
sum_min_file_path = 'ladder.min.js'
exclude_list = [sum_file_path, sum_min_file_path, 'import.js']
add_content = 'class Load { static onLoad(callback) { callback(); } }'

def is_exclude(text, exclude_suffix_list):
    is_exclude = False
    for exclude_suffix in exclude_suffix_list:
        if text.endswith(exclude_suffix):
            is_exclude = True
    return is_exclude
        
def get_files(folder_path, file_suffix, exclude_suffix_list):
    js_files = []
    if os.path.exists(folder_path):
        for file_path in os.listdir(folder_path):
            if file_path.endswith(file_suffix) and is_exclude(file_path, exclude_suffix_list) == False:
                js_files.append(folder_path + '/' + file_path)
    return js_files

def get_file(file_path):
    isExistFile = os.path.exists(file_path)
    if isExistFile == False:
        return {}
    with open(file_path, 'r') as file:
        context = file.read()
        try:
            return context;
        except Exception:
            return {}
        
def sum_files(files, seperator):
    result = '';
    for file in files:
        file_content = get_file(file)
        result += seperator + file_content
    return result

def add_context(content, add_content, seperator):
    if add_content != '':
        return content + seperator + add_content
    return content

def create_and_write_file(content, file_sum_path):
    with open(file_sum_path, 'w') as file:
        file.write(content)
        file.close()
        return
    
def create_min_content(content):
    url = 'https://www.toptal.com/developers/javascript-minifier/api/raw'
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {'input': content}
    response = requests.post(url, data=data, headers=headers)
    if response.status_code == 200:
        return {
            'code': response.status_code,
            'content': response.text
        }
    else:
        return {
            'code': response.status_code,
            'content': response.content
        }

js_files = get_files(folder_path, file_suffix, exclude_list)
content = sum_files(js_files, file_seperator)
content = add_context(content, add_content, file_seperator)
if content != '':
    create_and_write_file(content, folder_path + '/' + sum_file_path)
    print('🟢 create ' + sum_file_path + ' success')
    min_content_response = create_min_content(content)
    if min_content_response['code'] == 200:
        create_and_write_file(min_content_response['content'], folder_path + '/' + sum_min_file_path)
        print('🟢 create ' + sum_min_file_path + ' success')
    else:
        print('🔴 api error message: ' + str(min_content_response['content']))
else:
    print('🔴 no js files')

