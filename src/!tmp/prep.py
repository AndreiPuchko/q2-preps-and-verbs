import re
import json

pattern = r"\{(.*?)\}"
extractor = re.compile(pattern)

stcs = [x for x in open("text.txt").readlines() if x != ""]

rez = {x.split(",")[0]: ",".join(x.split(",")[1:]) for x in stcs}

print(rez)

prerps = set()
for key, value in rez.items():
    if prep:=extractor.findall(value):
        prerps.add(prep[0])

json.dumps(rez)

print(prerps)


